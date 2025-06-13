<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Project $project)
    {
        return Inertia::render('project/traceboard', ['tasks' => $project->tasks, 'project' => $project]);
    }

    public function store(Project $project)
    {
        $task = Task::create(['project_id'=>$project->id]);

        return back()->with('newTask', $task);
    }

    public function destroy(Task $task) {
        $task->delete();

        return back();
    }

    public function update(Task $task, Request $request){

        $validated = $request->validate([
            'title' => 'nullable|string|max:60',
            'image' => 'nullable|image|max:2048',
        ]);

        $task->update($validated);

        return back()->with('updatedTask', $task);
    }
}
