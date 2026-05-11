<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class TaskReorderController extends Controller
{
    /**
     * Persist a batch of Kanban task order changes as one undoable action.
     *
     * Example: PATCH /{project}/kanban/tasks/reorder.
     */
    public function __invoke(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->reorderRules($project));
        $taskIds = collect($validated['tasks'])->pluck('id')->all();
        $before = $snapshots->taskOrderState($project, $taskIds);

        DB::transaction(fn () => $this->updateTaskOrder($validated['tasks']));

        $after = $snapshots->taskOrderState($project, $taskIds);
        $undo->recordReorder($project, $request->user(), ProjectUndoActionType::REORDER_TASKS, 'tasks', $before, $after);

        return back();
    }

    /**
     * @return array<string, array<int, string|Exists>|string>
     */
    private function reorderRules(Project $project): array
    {
        return [
            'tasks' => ['required', 'array'],
            'tasks.*.id' => ['required', 'string', $this->projectTaskRule($project)],
            'tasks.*.position' => ['required', 'integer'],
            'tasks.*.column_id' => ['sometimes', 'string', $this->projectColumnRule($project)],
            'tasks.*.status' => 'sometimes|string|in:pending,in_progress,completed',
        ];
    }

    private function projectTaskRule(Project $project): Exists
    {
        return Rule::exists('tasks', 'id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }

    private function projectColumnRule(Project $project): Exists
    {
        return Rule::exists('columns', 'id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }

    /**
     * @param  array<int, array<string, int|string>>  $tasks
     */
    private function updateTaskOrder(array $tasks): void
    {
        foreach ($tasks as $task) {
            Task::where('id', $task['id'])->update($this->taskOrderUpdates($task));
        }
    }

    /**
     * @return array<string, int|string|null>
     */
    private function taskOrderUpdates(array $task): array
    {
        return array_filter([
            'column_id' => $task['column_id'] ?? null,
            'position' => $task['position'],
            'status' => $task['status'] ?? null,
        ], fn (int|string|null $value): bool => $value !== null);
    }
}
