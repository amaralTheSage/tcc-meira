<?php

namespace App\Http\Controllers;

use App\Enums\ColumnType;
use App\Enums\ProjectUndoActionType;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Events\TaskDescription;
use App\Events\TaskImageUpdated;
use App\Events\TaskMoved;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class TaskController extends Controller
{
    use GuardsProjectResources;

    /**
     * Render the realtime task board.
     *
     * Example: GET /{project}/traceboard.
     */
    public function index(Project $project): Response
    {
        // add tasks.sources se começar a dar pau
        return Inertia::render('project/traceboard', ['project' => $project->load(['tasks.targets', 'members', 'notes', 'tags', 'tasks.tags', 'sprints'])]);
    }

    /**
     * Create a task from a traceboard or Kanban request.
     *
     * Example: POST /{project}/tasks.
     */
    public function store(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $this->validatedStorePayload($project, $request);
        $task = $this->storedTaskForPayload($project, $validated);

        if ($task->wasRecentlyCreated) {
            $this->broadcastTaskAdded($task);
            $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_TASK, 'Create task', 'task', $snapshots->task($task->fresh()));
        }

        return back()->with('newTask', $task);
    }

    /**
     * Update task metadata and broadcast the changed fields.
     *
     * Example: PATCH /{project}/tasks/{task}.
     */
    public function update(Project $project, string $task, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->updateRules($project));
        $taskModel = $this->traceboardTaskForWrite($project, $task, $validated);
        $before = $taskModel->wasRecentlyCreated ? null : $snapshots->task($taskModel);
        $updates = $this->taskUpdates($project, $taskModel, $request);
        $taskModel->update($updates);

        $this->broadcastTaskAddedIfNeeded($taskModel);
        $this->completeSubtasksWhenDone($project, $taskModel, $updates);
        $this->recordTaskUpdate($project, $request, $undo, $snapshots, $taskModel, $before);
        $this->broadcastTaskUpdates($request, $taskModel);

        return back()->with('updatedTask', $taskModel);
    }

    /**
     * Persist a task position after a traceboard drag.
     *
     * Example: PATCH /{project}/tasks/{task}/move.
     */
    public function move(Project $project, string $task, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $userId = $request->user()->id;
        $validated = $this->validatedMovePayload($request);

        $taskModel = $this->traceboardTaskForWrite($project, $task, $validated);
        $before = $this->moveStartSnapshot($this->taskSnapshot($snapshots, $taskModel), $validated);
        $taskModel->update($this->movePosition($validated));

        $this->broadcastTaskAddedIfNeeded($taskModel);
        $this->recordTaskMove($project, $request, $undo, $snapshots, $taskModel, $before, $validated);
        broadcast(new NodeDragged($taskModel->id, 'Task', $request->x, $request->y, $userId))->toOthers();

        return back();
    }

    /**
     * Delete a task by id and broadcast its removal.
     *
     * Example: DELETE /{project}/tasks/{task_id}.
     */
    public function destroy(Project $project, string $task_id, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $task = Task::find($task_id);

        // Para não enviar erros caso a task tenha sido removida antes de ser adicionada ao DB
        if ($task) {
            $this->ensureTaskBelongsToProject($project, $task);
            $before = $snapshots->task($task);
            $task->delete();
            $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_TASK, 'Delete task', 'task', $before);
            broadcast(new NodeRemoved($task_id, 'Task'))->toOthers();
        }

        return back();
    }

    /**
     * Mark a task as completed.
     *
     * Example: PATCH /{project}/tasks/{task}/complete.
     */
    public function complete(Project $project, string $task, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $taskModel = $this->traceboardTaskForWrite($project, $task, ['status' => 'completed']);
        $before = $snapshots->task($taskModel);
        $taskModel->update(['status' => 'completed']);
        $taskModel->subtasks()->update(['completed' => true]);
        $after = $snapshots->task($taskModel->fresh());

        $this->broadcastTaskAddedIfNeeded($taskModel);
        $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_TASK, 'Complete task', 'task', $before, $after);
        broadcast(new TaskMoved($taskModel->id, $taskModel->position, $taskModel->column_id))->toOthers();

        return back()->with('completedTask', $taskModel);
    }

    /**
     * @return array<string, int|string|null>
     */
    private function validatedStorePayload(Project $project, Request $request): array
    {
        $validated = $request->validate($this->storeRules($project));
        $validated['project_id'] = $project->id;
        $backlogColumnId = $this->backlogColumnId($project);

        if (! isset($validated['column_id']) && $backlogColumnId !== null) {
            $validated['column_id'] = $backlogColumnId;
        }

        return $validated;
    }

    /**
     * @param  array<string, int|string|null>  $validated
     */
    private function storedTaskForPayload(Project $project, array $validated): Task
    {
        $task = Task::find($validated['id']);
        if ($task !== null) {
            $this->ensureTaskBelongsToProject($project, $task);

            return $task;
        }

        return Task::create($validated);
    }

    /**
     * @param  array<string, int|string|null>  $values
     */
    private function traceboardTaskForWrite(Project $project, string $taskId, array $values): Task
    {
        $task = Task::find($taskId);
        if ($task !== null) {
            $this->ensureTaskBelongsToProject($project, $task);

            return $task;
        }

        return Task::create($this->placeholderTaskPayload($project, $taskId, $values));
    }

    /**
     * @param  array<string, int|string|null>  $values
     * @return array<string, int|string|null>
     */
    private function placeholderTaskPayload(Project $project, string $taskId, array $values): array
    {
        return array_merge([
            'id' => $taskId,
            'project_id' => $project->id,
            'column_id' => $values['column_id'] ?? $this->backlogColumnId($project),
            'position' => $values['position'] ?? 0,
            'x' => $values['x'] ?? 0,
            'y' => $values['y'] ?? 0,
        ], $this->optionalTaskCreateFields($values));
    }

    /**
     * @param  array<string, int|string|null>  $values
     * @return array<string, int|string|null>
     */
    private function optionalTaskCreateFields(array $values): array
    {
        $optionalFields = [];

        foreach (['title', 'status', 'description', 'sprint_id'] as $field) {
            if (array_key_exists($field, $values)) {
                $optionalFields[$field] = $values[$field];
            }
        }

        return $optionalFields;
    }

    private function broadcastTaskAddedIfNeeded(Task $task): void
    {
        if (! $task->wasRecentlyCreated) {
            return;
        }

        $this->broadcastTaskAdded($task);
    }

    private function broadcastTaskAdded(Task $task): void
    {
        broadcast(new NodeAdded($task->id, 'Task', (int) $task->x, (int) $task->y))->toOthers();
    }

    /**
     * @return array<string, string>
     */
    private function storeRules(Project $project): array
    {
        return [
            'id' => 'required|string',
            'title' => 'sometimes|string|max:135',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'position' => 'sometimes|integer',
            'column_id' => ['sometimes', 'string', $this->projectColumnRule($project)],
            'project_id' => 'sometimes|string',
            'sprint_id' => ['sometimes', 'nullable', 'string', $this->projectSprintRule($project)],
        ];
    }

    private function backlogColumnId(Project $project): int|string|null
    {
        return Column::where('project_id', $project->id)
            ->where('type', ColumnType::BACKLOG->value)
            ->value('id');
    }

    /**
     * @return array<string, string>
     */
    private function updateRules(Project $project): array
    {
        return [
            'title' => 'sometimes|string|max:135',
            'image' => 'sometimes|image|max:2048',
            'image_link' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'position' => 'sometimes|integer',
            'column_id' => ['sometimes', 'string', $this->projectColumnRule($project)],
            'status' => 'sometimes|string|in:pending,in_progress,completed',
            'description' => 'sometimes|string',
            'sprint_id' => ['sometimes', 'nullable', 'string', $this->projectSprintRule($project)],
        ];
    }

    private function projectColumnRule(Project $project): Exists
    {
        return Rule::exists('columns', 'id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }

    private function projectSprintRule(Project $project): Exists
    {
        return Rule::exists('sprints', 'id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }

    /**
     * @return array<string, int|string|null>
     */
    private function taskUpdates(Project $project, Task $task, Request $request): array
    {
        $updates = $this->baseTaskUpdates($task, $request);

        return $this->withImageUpdate($project, $request, $updates);
    }

    /**
     * @return array<string, int|string|null>
     */
    private function baseTaskUpdates(Task $task, Request $request): array
    {
        return [
            'title' => $request->title ?? $task->title,
            'x' => $request->x ?? $task->x,
            'y' => $request->y ?? $task->y,
            'position' => $request->position ?? $task->position,
            'column_id' => $request->column_id ?? $task->column_id,
            'status' => $request->status ?? $task->status,
            'description' => $request->description ?? $task->description,
            'sprint_id' => $request->has('sprint_id') ? $request->sprint_id : $task->sprint_id,
        ];
    }

    /**
     * @param  array<string, int|string|null>  $updates
     * @return array<string, int|string|null>
     */
    private function withImageUpdate(Project $project, Request $request, array $updates): array
    {
        if ($request->image_link === 'REMOVE_IMAGE') {
            $updates['image'] = null;
        } elseif ($request->hasFile('image')) {
            $updates['image'] = $this->storedImageUrl($project, $request);
        } elseif ($request->filled('image_link')) {
            $updates['image'] = $request->image_link;
        }

        return $updates;
    }

    private function storedImageUrl(Project $project, Request $request): string
    {
        $image = $request->file('image');
        if ($image === null) {
            throw new InvalidArgumentException('Task image upload was null; expected uploaded image file.');
        }

        $imagePath = Storage::disk('public')->putFile('projects/'.$project->id, $image);

        return asset(Storage::url($imagePath));
    }

    /**
     * @param  array<string, int|string|null>  $updates
     */
    private function completeSubtasksWhenDone(Project $project, Task $task, array $updates): void
    {
        $doneColumnId = $this->doneColumnId($project);

        $movedToDone = $doneColumnId !== null && (string) $updates['column_id'] === (string) $doneColumnId;

        if ($updates['status'] === 'completed' || $movedToDone) {
            $task->subtasks()->update(['completed' => true]);
        }
    }

    private function doneColumnId(Project $project): int|string|null
    {
        return Column::where('project_id', $project->id)
            ->where('type', ColumnType::DONE->value)
            ->value('id');
    }

    /**
     * @return array{x: int, y: int, _undoable?: bool, _undo_before?: array{x: int, y: int}}
     */
    private function validatedMovePayload(Request $request): array
    {
        return $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer',
            '_undoable' => 'sometimes|boolean',
            '_undo_before' => 'sometimes|array',
            '_undo_before.x' => 'required_with:_undo_before|integer',
            '_undo_before.y' => 'required_with:_undo_before|integer',
        ]);
    }

    private function moveStartSnapshot(array $before, array $validated): array
    {
        if (! isset($validated['_undo_before'])) {
            return $before;
        }

        $before['attributes']['x'] = $validated['_undo_before']['x'];
        $before['attributes']['y'] = $validated['_undo_before']['y'];

        return $before;
    }

    /**
     * @return array{x: int, y: int}
     */
    private function movePosition(array $validated): array
    {
        return ['x' => $validated['x'], 'y' => $validated['y']];
    }

    private function recordTaskUpdate(
        Project $project,
        Request $request,
        ProjectUndoRecorder $undo,
        ProjectBoardSnapshotter $snapshots,
        Task $task,
        ?array $before
    ): void {
        $after = $this->taskSnapshot($snapshots, $task);

        $before === null
            ? $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_TASK, 'Create task', 'task', $after)
            : $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_TASK, 'Update task', 'task', $before, $after);
    }

    private function recordTaskMove(
        Project $project,
        Request $request,
        ProjectUndoRecorder $undo,
        ProjectBoardSnapshotter $snapshots,
        Task $task,
        array $before,
        array $validated
    ): void {
        if (! ($validated['_undoable'] ?? false)) {
            return;
        }

        $after = $this->taskSnapshot($snapshots, $task);
        $undo->recordTraceboardMove($project, $request->user(), ProjectUndoActionType::MOVE_TASK, 'Move task', 'task', $before, $after);
    }

    private function taskSnapshot(ProjectBoardSnapshotter $snapshots, Task $task): array
    {
        return $snapshots->task($task->fresh() ?? $task);
    }

    private function broadcastTaskUpdates(Request $request, Task $task): void
    {
        if ($request->title) {
            broadcast(new NodeRenamed($task->id, 'Task', $request->title))->toOthers();
        }

        if ($request->has(['x', 'y'])) {
            broadcast(new NodeDragged($task->id, 'Task', $request->x, $request->y, null))->toOthers();
        }

        $this->broadcastSecondaryTaskUpdates($request, $task);
    }

    private function broadcastSecondaryTaskUpdates(Request $request, Task $task): void
    {
        if ($request->position || $request->column_id) {
            broadcast(new TaskMoved($task->id, $task->position, $task->column_id))->toOthers();
        }

        if ($request->description) {
            broadcast(new TaskDescription($task->id, $task->description))->toOthers();
        }

        if ($this->requestChangesTaskImage($request)) {
            broadcast(new TaskImageUpdated($task->id, $task->image))->toOthers();
        }
    }

    private function requestChangesTaskImage(Request $request): bool
    {
        return $request->hasFile('image')
            || $request->filled('image_link')
            || $request->image_link === 'REMOVE_IMAGE';
    }
}
