<?php

namespace App\Http\Controllers;

use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\TaskAdded;
use App\Events\TaskDescription;
use App\Events\TaskMoved;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Enums\ColumnType;
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
        return Inertia::render('project/traceboard', ['project' => $project->load(['tasks.targets',  'members', 'notes', 'tags', 'tasks.tags'])]);
    }

    public function store(Project $project, Request $request)
    {
        // todo: Validate
        $validated = $request->validate([
            'id' => 'required|string',
            'title' => 'sometimes|string|max:135',
            'x' => 'required|integer',
            'y' => 'required|integer',
            'position' => 'sometimes|integer',
            'column_id' => 'sometimes|string',
            'project_id' => 'sometimes|string'
        ]);

        $validated['project_id'] = $project->id;

        if (!isset($validated['column_id'])) {
            $backlogColumn = Column::where('project_id', $project->id)
                ->where('type', ColumnType::BACKLOG->value)
                ->first();

            if ($backlogColumn) {
                $validated['column_id'] = $backlogColumn->id;
            }
        }

        $task = Task::create($validated);

        broadcast(new NodeAdded($validated['id'], 'Task', $validated['x'], $validated['y']))->toOthers();

        return back()->with('newTask', $task);
    }

    public function update(Project $project, Task $task, Request $request)
    {
        $request->validate([
            'title' => 'sometimes|string|max:135',
            'image' => 'sometimes|image|max:2048',
            'image_link' => 'sometimes|string',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
            'position' => 'sometimes|integer',
            'column_id' => 'sometimes|string',
            'status' => 'sometimes|string|in:pending,in_progress,completed',
            'description' => 'sometimes|string',
        ]);

        $updates = [
            'title' => $request->title ?? $task->title,
            'x' => $request->x ?? $task->x,
            'y' => $request->y ?? $task->y,
            'position' => $request->position ?? $task->position,
            'column_id' => $request->column_id ?? $task->column_id,
            'status' => $request->status ?? $task->status,
            'description' => $request->description ?? $task->description,
        ];

        if ($request->image_link === 'REMOVE_IMAGE') {
            $updates['image'] = null;
        } elseif ($request->hasFile('image')) {
            $imagePath = Storage::disk('public')->putFile('projects/' . $project->id, $request->image);
            $updates['image'] = asset(Storage::url($imagePath));
        } elseif ($request->filled('image_link')) {
            $updates['image'] = $request->image_link;
        }

        $task->update($updates);

        // ---- Broadcasting Events
        if ($request->title) {
            broadcast(new NodeRenamed($task->id, 'Task', $request->title))->toOthers();
        }

        if ($request->x && $request->y) {
            broadcast(new NodeDragged($task->id, 'Task', $request->x, $request->y, null))->toOthers();
        }

        if ($request->position || $request->column_id) {
            broadcast(new TaskMoved($task->id, $task->position, $task->column_id))->toOthers();
        }

        if ($request->description) {
            broadcast(new TaskDescription($task->id, $task->description))->toOthers();
        }

        return back()->with('updatedTask', $task);
    }

    public function move(Project $project, Task $task, Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $task->update($validated);

        broadcast(new NodeDragged($task->id, 'Task', $request->x, $request->y, $userId))->toOthers();

        return back();
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

    public function complete(Project $project, Task $task)
    {
        $task->update(['status' => 'completed']);

        broadcast(new TaskMoved($task->id, $task->position, $task->column_id))->toOthers();

        return back()->with('completedTask', $task);
    }
}
