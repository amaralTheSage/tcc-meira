<?php

namespace App\Http\Controllers;

use App\Models\Column;
use Illuminate\Http\Request;

class ColumnsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Project $project, Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'position' => ['required', 'integer'],
        ]);

        $validated['project_id'] = $project->id;

        $subtask = Subtask::create($validated);

        return back()->with('newColumn', $column);
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
    public function destroy(string $column_id)
    {
        $column = Column::find($column_id);

        if ($column) {
            $column->delete();
        }

        return back();
    }
}
