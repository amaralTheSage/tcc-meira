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

        // Ensure tasks belong to the same project
        $invalidTasks = Task::whereIn('id', $validated['task_ids'])
            ->where('project_id', '!=', $sprint->project_id)
            ->exists();

        if ($invalidTasks) {
            return back()->withErrors(['sprint' => 'One or more tasks do not belong to this project.']);
        }

        Task::whereIn('id', $validated['task_ids'])->update(['sprint_id' => $sprint->id]);

        return back();
    }

    public function start(Request $request, Sprint $sprint)
    {
        // Ensure no other sprint in this project is active
        $hasActive = $sprint->project->sprints()->where('status', 'active')->exists();

        if ($hasActive) {
            return back()->withErrors(['sprint' => 'Another sprint is already active in this project.']);
        }

        $sprint->update(['status' => 'active']);

        return back();
    }

    public function complete(Request $request, Sprint $sprint)
    {
        $sprint->update(['status' => 'completed']);

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
    public function update(Request $request, Project $project, Sprint $sprint)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after_or_equal:start_at',
        ]);

        $sprint->update($validated);

        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, Sprint $sprint)
    {
        // Dissociate tasks from the sprint before deleting
        $sprint->tasks()->update(['sprint_id' => null]);
        $sprint->delete();

        return back();
    }
}
