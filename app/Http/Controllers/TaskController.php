<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Storage;

class TaskController extends Controller
{
    public function index(Project $project)
    {
        // add tasks.sources se começar a dar pau
        return Inertia::render('project/traceboard', ['project' => $project->load(['tasks.targets',  'members', 'notes'])]);
    }

    public function store(Project $project, Collumn $collumn, Request $request)
    {
        // todo: Validate
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'position' => 'required|integer'
        ]);

        $validated['project_id'] = $project->id;

        $validated['collumn_id'] = $collumn->id;

        $task = Task::create($validated);

        return back()->with('newTask', $task);
    }

    public function update(Project $project, Task $task, Request $request, Collumn $collumn)
    {
        $request->validate([
            'title' => 'sometimes|string|max:135',
            'image' => 'sometimes|image|max:2048',
            'image_link' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'position' => 'sometimes|integer',
            'collumn_id' => 'sometimes|string'
        ]);

        $updates = [
            'title' => $request->title ?? $task->title,
            'x' => $request->x ?? $task->x,
            'y' => $request->y ?? $task->y,
            'position' => $request->position ?? $task->position ,
            'collumn_id' => $request->collumn_id ?? $collumn->id,
        ];

        if ($request->image_link === 'REMOVE_IMAGE') {
            $request->image = null;
            $request->image_link = null;
        }

        if ($request->hasFile('image')) {
            $imagePath = Storage::disk('public')->putFile('projects/'.$project->id.'/', $request->image);
            $updates['image'] = asset(Storage::url($imagePath));

        } elseif ($request->filled('image_link')) {
            $updates['image'] = $request->image_link;
        }

        $task->update($updates);

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
