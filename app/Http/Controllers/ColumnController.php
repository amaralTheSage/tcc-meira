<?php

namespace App\Http\Controllers;

use App\Events\ColumnAdded;
use App\Events\ColumnMoved;
use App\Events\ColumnNamed;
use App\Events\ColumnRemove;
use App\Models\Column;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ColumnController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Project $project)
    {
        return Inertia::render('project/kanban', [
        'project' => $project->load('members'),
        'columns' => Column::where('project_id', $project->id)
            ->with('tasks.subtasks.users')
            ->with('tasks.tags')
            ->with('tasks.users')
            ->orderBy('position', 'asc')
            ->get()
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Project $project, Request $request)
    {
        $validated = $request->validate([
            'position' => ['required', 'integer']
        ]);

        $validated['project_id'] = $project->id;

        $column = Column::create($validated);

        broadcast(new ColumnAdded($column->id, $column->position))->toOthers();

        return back();
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Project $project, Request $request, Column $column)
    {


        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'position' => 'sometimes|integer',
        ]);

        $column->update($validated);

        broadcast(new ColumnNamed($column->id, $column->name))->toOthers();

        return back();
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'columns' => 'required|array',
            'columns.*.id' => 'required|integer',
            'columns.*.position' => 'required|integer',
        ]);

        foreach ($validated['columns'] as $columnData) {
            Column::where('id', $columnData['id'])->update(['position' => $columnData['position']]);

            broadcast(new ColumnMoved($columnData['id'], $columnData['position']))->toOthers();
        }

        

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, $id)
    {
        $column = Column::find($id);
        $column->delete();

        broadcast(new ColumnRemove($id))->toOthers();

        return back();
    }
}
