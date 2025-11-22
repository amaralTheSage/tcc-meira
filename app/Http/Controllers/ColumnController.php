<?php

namespace App\Http\Controllers;

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
        'project' => $project,
        'columns' => Column::where('project_id', $project->id)
            ->with('tasks.subtasks')
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

        Column::create($validated);

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
        return back();
    }
}
