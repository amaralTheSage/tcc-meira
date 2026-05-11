<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Events\ColumnAdded;
use App\Events\ColumnMoved;
use App\Events\ColumnNamed;
use App\Events\ColumnRemove;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Column;
use App\Models\Project;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ColumnController extends Controller
{
    use GuardsProjectResources;

    /**
     * Render the project Kanban board.
     *
     * Example: GET /{project}/kanban.
     */
    public function index(Project $project): Response
    {
        return Inertia::render('project/kanban', [
            'project' => $project->load(['members', 'sprints']),
            'columns' => $this->projectColumns($project),
        ]);
    }

    /**
     * Create a Kanban column.
     *
     * Example: POST /{project}/kanban/column.
     */
    public function store(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate([
            'position' => ['required', 'integer'],
        ]);

        $validated['project_id'] = $project->id;

        $column = Column::create($validated);

        broadcast(new ColumnAdded($column->id, $column->position))->toOthers();
        $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_COLUMN, 'Create column', 'column', $snapshots->column($column->fresh()));

        return back();
    }

    /**
     * Update a Kanban column name or position.
     *
     * Example: PATCH /{project}/column/update/{column}.
     */
    public function update(Project $project, Request $request, Column $column, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $column);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'position' => 'sometimes|integer',
        ]);

        $before = $snapshots->column($column);
        $column->update($validated);
        $after = $snapshots->column($column->fresh());

        broadcast(new ColumnNamed($column->id, $column->name))->toOthers();
        $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_COLUMN, 'Update column', 'column', $before, $after);

        return back();
    }

    /**
     * Reorder Kanban columns.
     *
     * Example: PATCH /{project}/kanban/columns/reorder.
     */
    public function reorder(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate([
            'columns' => 'required|array',
            'columns.*.id' => 'required|integer',
            'columns.*.position' => 'required|integer',
        ]);

        $this->ensureColumnPayloadsBelongToProject($project, $validated['columns']);
        $columnIds = collect($validated['columns'])->pluck('id')->all();
        $before = $snapshots->columnOrderState($project, $columnIds);

        DB::transaction(fn () => $this->updateColumnOrder($validated['columns']));
        $this->broadcastColumnMoves($validated['columns']);
        $after = $snapshots->columnOrderState($project, $columnIds);
        $undo->recordReorder($project, $request->user(), ProjectUndoActionType::REORDER_COLUMNS, 'columns', $before, $after);

        return back();
    }

    /**
     * Delete a Kanban column.
     *
     * Example: DELETE /{project}/column/delete/{column}.
     */
    public function destroy(Project $project, Column $column, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $column);
        $before = $snapshots->column($column);
        $column->delete();

        broadcast(new ColumnRemove($column->id))->toOthers();
        $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_COLUMN, 'Delete column', 'column', $before);

        return back();
    }

    private function projectColumns(Project $project): Collection
    {
        return Column::where('project_id', $project->id)
            ->with('tasks.subtasks.users')
            ->with('tasks.tags')
            ->with('tasks.users')
            ->orderBy('position', 'asc')
            ->get();
    }

    /**
     * @param  array<int, array{id: int, position: int}>  $columns
     */
    private function updateColumnOrder(array $columns): void
    {
        foreach ($columns as $columnData) {
            Column::where('id', $columnData['id'])->update(['position' => $columnData['position']]);
        }
    }

    /**
     * @param  array<int, array{id: int, position: int}>  $columns
     */
    private function broadcastColumnMoves(array $columns): void
    {
        foreach ($columns as $columnData) {
            broadcast(new ColumnMoved($columnData['id'], $columnData['position']))->toOthers();
        }
    }
}
