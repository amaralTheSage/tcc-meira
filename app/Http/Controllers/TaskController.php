<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Project $project)
    {
        return Inertia::render('project/traceboard', ['project' => $project->load('tasks')]);
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

      public function batchUpdate(Request $request, Project $project)
    {
        $validated = $request->validate([
            'changes' => 'required|array',
            'changes.*.id' => 'required|string',
            'changes.*.x' => 'sometimes|numeric',
            'changes.*.y' => 'sometimes|numeric', 
            'changes.*.title' => 'sometimes|string|max:255',
        ]);

        try {
            DB::beginTransaction();
            
            foreach ($validated['changes'] as $change) {
                $task = Task::where('id', $change['id'])
                    ->where('project_id', $project->id)
                    ->first();
                
                if (!$task) {
                    Log::warning("Task not found for batch update", ['task_id' => $change['id']]);
                    continue;
                }

                // Build update array, excluding the ID
                $updateData = [];
                if (isset($change['x'])) $updateData['x'] = $change['x'];
                if (isset($change['y'])) $updateData['y'] = $change['y'];
                if (isset($change['title'])) $updateData['title'] = $change['title'];

                if (!empty($updateData)) {
                    $task->update($updateData);
                }
            }
            
            DB::commit();
            
            return back()->with([
                'success' => true,
                'message' => 'Tasks updated successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Batch update failed', ['error' => $e->getMessage()]);
            
            return back()->with([
                'success' => false,
                'message' => 'Failed to update tasks'
            ], 500);
        }
    }
}
