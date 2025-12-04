<?php

namespace App\Http\Controllers;

use App\Events\SubtaskAdded;
use Illuminate\Http\Request;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\Project;
use App\Models\User;
use App\Models\Column;

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

        broadcast(new SubtaskAdded($subtask->id, $subtask->title))->toOthers();

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
    public function update(Request $request, string $project_id, string $subtask_id)
    {
        $subtask = Subtask::findOrFail($subtask_id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:135',
            'position' => 'sometimes|integer',
            'completed' => 'sometimes|boolean'
        ]);

        $subtask->update($validated);

        // Check if all subtasks are completed and update task status accordingly
        if (isset($validated['completed']) && $validated['completed']) {
            $this->checkAndUpdateTaskCompletion($subtask->task);
        }

        return back();
    }

    /**
     * Check if all subtasks are completed and update task status
     */
    private function checkAndUpdateTaskCompletion(Task $task)
    {
        $totalSubtasks = $task->subtasks()->count();
        $completedSubtasks = $task->subtasks()->where('completed', true)->count();

        if ($totalSubtasks > 0 && $totalSubtasks === $completedSubtasks) {
            // All subtasks are completed, update task status and move to done column
            $doneColumn = Column::where('project_id', $task->project_id)
                ->where('type', 'done')
                ->first();

            if ($doneColumn) {
                $task->update([
                    'status' => 'completed',
                    'column_id' => $doneColumn->id
                ]);
            }
        }
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

    public function attach(Project $project, Subtask $subtask, Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if ($subtask->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User already assigned to subtask'], 400);
        }

        $subtask->users()->attach($request->user_id);

        return redirect()->back()->with('success', 'User assigned to subtask successfully');
    }

    public function detach(Project $project, Subtask $subtask, User $user)
    {
        $subtask->users()->detach($user->id);

        return back();
    }
}
