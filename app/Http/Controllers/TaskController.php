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
        return Inertia::render('project/traceboard', ['project' => $project->load('tasks')]);
    }

    public function store(Project $project, Request $request)
    {
        // todo: Validate
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $validated['project_id'] = $project->id;

        $task = Task::create($validated);

        return back()->with('newTask', $task);
    }

    public function update(Project $project, Task $task, Request $request)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:38',
            'image' => 'sometimes|image|max:2048',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
        ]);

        $task->update($validated);

        return back()->with('updatedTask', $task);
    }

    public function destroy(Project $project, string $task_id)
    {
        $task = Task::find($task_id);

        // Para não enviar erros caso a task tenha sido removida antes de ser adicionada ao DB
        if ($task) {
            $task->delete();
        }

        return back();
    }
}
