<?php

namespace App\Http\Controllers;

use App\Events\SubtaskAdded;
use App\Events\SubtaskComplete;
use App\Models\Column;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubtaskController extends Controller
{
    /**
     * Create a subtask under a task.
     *
     * Example: POST /{project}/kanban/subtasks.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'position' => ['nullable', 'integer'],
            'task_id' => ['required', 'string'],
        ]);

        $subtask = Subtask::create($this->withDefaultPosition($validated));

        broadcast(new SubtaskAdded($subtask->id, $subtask->title))->toOthers();

        return redirect()->back()->with('newSubtask', $subtask);
    }

    /**
     * Update a subtask and sync parent completion when needed.
     *
     * Example: PATCH /{project}/update-subtask/{subtask_id}.
     */
    public function update(Request $request, string $project_id, string $subtask_id): RedirectResponse
    {
        $subtask = Subtask::findOrFail($subtask_id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:135',
            'position' => 'sometimes|integer',
            'completed' => 'sometimes|boolean',
        ]);

        $subtask->update($validated);

        $this->syncCompletedSubtask($subtask, $validated);

        return back();
    }

    /**
     * Delete a subtask by id.
     *
     * Example: DELETE /{project}/delete-subtask/{subtask_id}.
     */
    public function destroy(Project $project, string $subtask_id): RedirectResponse
    {
        $subtask = Subtask::find($subtask_id);

        if ($subtask) {
            $subtask->delete();
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
