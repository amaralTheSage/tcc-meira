<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SprintController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Project $project)
    {
        return Inertia::render('project/sprint-planning', [
            'project' => $project->load('sprints.tasks'),
            'tasks' => $project->tasks,
            'newSprint' => session('newSprint'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after_or_equal:start_at',
        ]);

        $sprint = $project->sprints()->create($validated);

        return back()->with('newSprint', $sprint);
    }

    public function attachTasks(Request $request, Sprint $sprint)
    {
        $validated = $request->validate([
            'task_ids' => 'required|array',
            'task_ids.*' => 'string|exists:tasks,id',
        ]);

        Task::whereIn('id', $validated['task_ids'])->update(['sprint_id' => $sprint->id]);

        return back();
    }
    /**
     * Display the specified resource.
     */
    public function show(Sprint $sprint)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sprint $sprint)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sprint $sprint)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sprint $sprint)
    {
        //
    }
}
