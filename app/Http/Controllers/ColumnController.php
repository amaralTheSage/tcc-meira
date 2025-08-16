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
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'sometimes|string|max:50',
            'position' => 'sometimes|integer',
        ]);

        $updates = [
            'name' => $request->name ?? $column->name,
            'position' => $request->position ?? $column->position,
        ];

        $subtask->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, $id)
    {
        Column::where('id', $id)->delete();

        return back();
    }
}
