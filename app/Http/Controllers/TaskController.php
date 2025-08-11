<?php

namespace App\Http\Controllers;

use App\Events\NodeAdded;
use App\Events\TaskAdded;
use App\Events\NodeRemoved;
use App\Models\Column;
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

    public function store(Project $project, Request $request)
    {
        // todo: Validate
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'position' => 'integer',
        ]);

        $validated['project_id'] = $project->id;

        $validated['column_id'] = 1;

        $task = Task::create($validated);

        broadcast(new NodeAdded($validated['id'], 'Task', $validated['x'], $validated['y'] ))->toOthers();

        return back()->with('newTask', $task);
    }

    public function update(Project $project, Task $task, Request $request, Column $column)
    {
        $request->validate([
            'title' => 'sometimes|string|max:135',
            'image' => 'sometimes|image|max:2048',
            'image_link' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'position' => 'sometimes|integer',
            'column_id' => 'sometimes|string',
        ]);

        $updates = [
            'title' => $request->title ?? $task->title,
            'x' => $request->x ?? $task->x,
            'y' => $request->y ?? $task->y,
            'position' => $request->position ?? $task->position,
            'column_id' => $request->column_id ?? $column->id,
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
            broadcast(new NodeRemoved($task_id, 'Task'))->toOthers();
        }

        return back();
    }
}
