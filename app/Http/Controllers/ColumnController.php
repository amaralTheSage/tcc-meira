<?php

namespace App\Http\Controllers;

use App\Events\ColumnAdded;
use App\Events\ColumnMoved;
use App\Events\ColumnNamed;
use App\Events\ColumnRemove;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Column;
use App\Models\Project;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'position' => ['required', 'integer'],
        ]);

        $validated['project_id'] = $project->id;

        $column = Column::create($validated);

        broadcast(new ColumnAdded($column->id, $column->position))->toOthers();

        return back();
    }

    /**
     * Update a Kanban column name or position.
     *
     * Example: PATCH /{project}/column/update/{column}.
     */
    public function update(Project $project, Request $request, Column $column): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $column);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'position' => 'sometimes|integer',
        ]);

        $column->update($validated);

        broadcast(new ColumnNamed($column->id, $column->name))->toOthers();

        return back();
    }

    /**
     * Reorder Kanban columns.
     *
     * Example: PATCH /{project}/kanban/columns/reorder.
     */
    public function reorder(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'columns' => 'required|array',
            'columns.*.id' => 'required|integer',
            'columns.*.position' => 'required|integer',
        ]);

        $this->ensureColumnPayloadsBelongToProject($project, $validated['columns']);

        foreach ($validated['columns'] as $columnData) {
            Column::where('id', $columnData['id'])->update(['position' => $columnData['position']]);

            broadcast(new ColumnMoved($columnData['id'], $columnData['position']))->toOthers();
        }

        return back();
    }

    /**
     * Delete a Kanban column.
     *
     * Example: DELETE /{project}/column/delete/{column}.
     */
    public function destroy(Project $project, Column $column): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $column);
        $column->delete();

        broadcast(new ColumnRemove($column->id))->toOthers();

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
}
