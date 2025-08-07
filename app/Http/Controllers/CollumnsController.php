<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CollumnsController extends Controller
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
    public function store(Project $project,Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'position' => ['required', 'integer'],
        ]);

        $validated['project_id'] = $project->id;

        $subtask = Subtask::create($validated);

        return back()->with('newCollumn', $collumn);
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
            'position' => 'sometimes|integer'
        ]);

        $updates = [
            'name' => $request->name ?? $collumn->name,
            'position' => $request->position ?? $collumn->position
        ];

        $subtask->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $collumn_id)
    {
        $collumn = Collumn::find($collumn_id);

        if ($collumn) {
            $collumn->delete();
        }

        return back();
    }
}
