<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\Project;

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
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'position' => ['nullable', 'integer'],
            'task_id' => ['required', 'string'],
        ]);

        if (!isset($validated['position'])) {
            $maxPosition = Subtask::where('task_id', $validated['task_id'])->max('position');
            $validated['position'] = $maxPosition !== null ? $maxPosition + 1 : 0;
        }

        $subtask = Subtask::create($validated);

        return redirect()->back()->with('newSubtask', $subtask);
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

        $validated = $request->validate([
            'title' => 'sometimes|string|max:135',
            'position' => 'sometimes|integer',
        ]);

        $updates = [
            'title' => $request->title ?? $subtask->title,
            'position' => $request->position ?? $subtask->position,
        ];

        $subtask->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, string $subtask_id)
    {
        $subtask = Subtask::find($subtask_id);

        if ($subtask) {
            $subtask->delete();
        }

        return back();
    }
}
