<?php

namespace App\Http\Controllers;

use App\Enums\ColumnType;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Events\TaskDescription;
use App\Events\TaskImageUpdated;
use App\Events\TaskMoved;
use App\Models\Column;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class TaskController extends Controller
{
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
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $this->validatedStorePayload($project, $request);
        $task = Task::create($validated);

        broadcast(new NodeAdded($validated['id'], 'Task', $validated['x'], $validated['y']))->toOthers();

        return back()->with('newTask', $task);
    }

    /**
     * Update task metadata and broadcast the changed fields.
     *
     * Example: PATCH /{project}/tasks/{task}.
     */
    public function update(Project $project, Task $task, Request $request): RedirectResponse
    {
        $request->validate($this->updateRules());
        $updates = $this->taskUpdates($project, $task, $request);
        $task->update($updates);

        $this->completeSubtasksWhenDone($project, $task, $updates);
        $this->broadcastTaskUpdates($request, $task);

        return back()->with('updatedTask', $task);
    }

    /**
     * Persist a task position after a traceboard drag.
     *
     * Example: PATCH /{project}/tasks/{task}/move.
     */
    public function move(Project $project, Task $task, Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $task->update($validated);

        broadcast(new NodeDragged($task->id, 'Task', $request->x, $request->y, $userId))->toOthers();

        return back();
    }

    /**
     * Delete a task by id and broadcast its removal.
     *
     * Example: DELETE /{project}/tasks/{task_id}.
     */
    public function destroy(Project $project, string $task_id): RedirectResponse
    {
        $task = Task::find($task_id);

        // Para não enviar erros caso a task tenha sido removida antes de ser adicionada ao DB
        if ($task) {
            $task->delete();
            broadcast(new NodeRemoved($task_id, 'Task'))->toOthers();
        }

        return back();
    }

    /**
     * Mark a task as completed.
     *
     * Example: PATCH /{project}/tasks/{task}/complete.
     */
    public function complete(Project $project, Task $task): RedirectResponse
    {
        $task->update(['status' => 'completed']);

        broadcast(new TaskMoved($task->id, $task->position, $task->column_id))->toOthers();

        return back()->with('completedTask', $task);
    }

    /**
     * @return array<string, int|string|null>
     */
    private function validatedStorePayload(Project $project, Request $request): array
    {
        $validated = $request->validate($this->storeRules());
        $validated['project_id'] = $project->id;
        $backlogColumnId = $this->backlogColumnId($project);

        if (! isset($validated['column_id']) && $backlogColumnId !== null) {
            $validated['column_id'] = $backlogColumnId;
        }

        return $validated;
    }

    /**
     * @return array<string, string>
     */
    private function storeRules(): array
    {
        return [
            'id' => 'required|string',
            'title' => 'sometimes|string|max:135',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'position' => 'sometimes|integer',
            'column_id' => 'sometimes|string',
            'project_id' => 'sometimes|string',
            'sprint_id' => 'sometimes|integer|nullable',
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
    private function updateRules(): array
    {
        return [
            'title' => 'sometimes|string|max:135',
            'image' => 'sometimes|image|max:2048',
            'image_link' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'position' => 'sometimes|integer',
            'column_id' => 'sometimes|string',
            'status' => 'sometimes|string|in:pending,in_progress,completed',
            'description' => 'sometimes|string',
            'sprint_id' => 'sometimes|integer|nullable',
        ];
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

        if ($updates['status'] === 'completed' || ($doneColumnId !== null && $updates['column_id'] === $doneColumnId)) {
            $task->subtasks()->update(['completed' => true]);
        }
    }

    private function doneColumnId(Project $project): int|string|null
    {
        return Column::where('project_id', $project->id)
            ->where('type', ColumnType::DONE->value)
            ->value('id');
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
