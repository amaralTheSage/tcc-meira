<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SprintController extends Controller
{
    /**
     * Render project sprint planning.
     *
     * Example: GET /{project}/sprint.
     */
    public function index(Project $project): Response
    {
        return Inertia::render('project/sprint-planning', [
            'project' => $project->load('sprints.tasks'),
            'tasks' => $project->tasks,
            'newSprint' => session('newSprint'),
        ]);
    }

    /**
     * Create a sprint for a project.
     *
     * Example: POST /{project}/sprint.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after_or_equal:start_at',
        ]);

        $sprint = $project->sprints()->create($validated);

        return back()->with('newSprint', $sprint);
    }

    /**
     * Attach tasks to an existing sprint.
     *
     * Example: POST /sprints/{sprint}/attach-tasks.
     */
    public function attachTasks(Request $request, Sprint $sprint): RedirectResponse
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

    /**
     * Mark a sprint as active when no sibling sprint is active.
     *
     * Example: PATCH /sprints/{sprint}/start.
     */
    public function start(Sprint $sprint): RedirectResponse
    {
        // Ensure no other sprint in this project is active
        $hasActive = $sprint->project->sprints()->where('status', 'active')->exists();

        if ($hasActive) {
            return back()->withErrors(['sprint' => 'Another sprint is already active in this project.']);
        }

        $sprint->update(['status' => 'active']);

        return back();
    }

    /**
     * Mark a sprint as completed.
     *
     * Example: PATCH /sprints/{sprint}/complete.
     */
    public function complete(Sprint $sprint): RedirectResponse
    {
        $sprint->update(['status' => 'completed']);

        return back();
    }

    /**
     * Update sprint dates and title.
     *
     * Example: PATCH /{project}/sprint/{sprint}.
     */
    public function update(Request $request, Project $project, Sprint $sprint): RedirectResponse
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
     * Delete a sprint after removing task assignments.
     *
     * Example: DELETE /{project}/sprint/{sprint}.
     */
    public function destroy(Project $project, Sprint $sprint): RedirectResponse
    {
        // Dissociate tasks from the sprint before deleting
        $sprint->tasks()->update(['sprint_id' => null]);
        $sprint->delete();

        return back();
    }
}
