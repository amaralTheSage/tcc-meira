<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SubtaskController extends Controller
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
    public function store(Task $task, Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'position' => ['required', 'integer'],
        ]);

        $validated['task_id'] = $task->id;

        $subtask = Subtask::create($validated);

        return back()->with('newSubTask', $subtask);
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
    public function update(Request $request, Subtask $subtask)
    {
        $request->validate([
            'title' => 'sometimes|string|max:135',
            'position' => 'sometimes|integer'
        ]);

        $updates = [
            'title' => $request->title ?? $subtask->title,
            'position' => $request->position ?? $subtask->position
        ];

        $subtask->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $subtask_id)
    {
        $subtask = Subtask::find($subtask_id);

        if ($subtask) {
            $subtask->delete();
        }

        return back();
    }
}
