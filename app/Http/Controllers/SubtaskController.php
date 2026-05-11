<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Events\SubtaskAdded;
use App\Events\SubtaskComplete;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Column;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    use GuardsProjectResources;

    /**
     * Create a subtask under a task.
     *
     * Example: POST /{project}/kanban/subtasks.
     */
    public function store(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'position' => ['nullable', 'integer'],
            'task_id' => ['required', 'string', 'exists:tasks,id'],
        ]);

        $this->ensureTaskBelongsToProject($project, Task::findOrFail($validated['task_id']));

        $subtask = Subtask::create($this->withDefaultPosition($validated));

        broadcast(new SubtaskAdded($subtask->id, $subtask->title))->toOthers();
        $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_SUBTASK, 'Create subtask', 'subtask', $snapshots->subtask($subtask->fresh()));

        return redirect()->back()->with('newSubtask', $subtask);
    }

    /**
     * Update a subtask and sync parent completion when needed.
     *
     * Example: PATCH /{project}/update-subtask/{subtask_id}.
     */
    public function update(Project $project, Request $request, string $subtask_id, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $subtask = Subtask::findOrFail($subtask_id);
        $this->ensureSubtaskBelongsToProject($project, $subtask);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:135',
            'position' => 'sometimes|integer',
            'completed' => 'sometimes|boolean',
        ]);

        $before = $snapshots->subtask($subtask);
        $subtask->update($validated);

        $this->syncCompletedSubtask($subtask, $validated);
        $after = $snapshots->subtask($subtask->fresh());
        $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_SUBTASK, 'Update subtask', 'subtask', $before, $after);

        return back();
    }

    /**
     * Delete a subtask by id.
     *
     * Example: DELETE /{project}/delete-subtask/{subtask_id}.
     */
    public function destroy(Project $project, string $subtask_id, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $subtask = Subtask::find($subtask_id);

        if ($subtask) {
            $this->ensureSubtaskBelongsToProject($project, $subtask);
            $before = $snapshots->subtask($subtask);
            $subtask->delete();
            $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_SUBTASK, 'Delete subtask', 'subtask', $before);
        }

        return back();
    }

    /**
     * @param  array<string, int|string|null>  $validated
     * @return array<string, int|string|null>
     */
    private function withDefaultPosition(array $validated): array
    {
        if (isset($validated['position'])) {
            return $validated;
        }

        $maxPosition = Subtask::where('task_id', $validated['task_id'])->max('position');
        $validated['position'] = $maxPosition !== null ? $maxPosition + 1 : 0;

        return $validated;
    }

    /**
     * @param  array<string, bool|int|string|null>  $validated
     */
    private function syncCompletedSubtask(Subtask $subtask, array $validated): void
    {
        if (! array_key_exists('completed', $validated)) {
            return;
        }

        if ($validated['completed']) {
            $this->checkAndUpdateTaskCompletion($subtask->task);
        }

        broadcast(new SubtaskComplete($subtask->id, $validated['completed']))->toOthers();
    }

    /**
     * Check if all subtasks are completed and update task status.
     */
    private function checkAndUpdateTaskCompletion(Task $task): void
    {
        if (! $this->allSubtasksCompleted($task)) {
            return;
        }

        $doneColumn = $this->doneColumn($task);
        if ($doneColumn === null) {
            return;
        }

        $task->update(['status' => 'completed', 'column_id' => $doneColumn->id]);
    }

    private function allSubtasksCompleted(Task $task): bool
    {
        $totalSubtasks = $task->subtasks()->count();
        $completedSubtasks = $task->subtasks()->where('completed', true)->count();

        return $totalSubtasks > 0 && $totalSubtasks === $completedSubtasks;
    }

    private function doneColumn(Task $task): ?Column
    {
        return Column::where('project_id', $task->project_id)
            ->where('type', 'done')
            ->first();
    }
}
