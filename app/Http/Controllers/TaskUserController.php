<?php

namespace App\Http\Controllers;

use App\Events\TaskAssignedUser;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskUserController extends Controller
{
    /**
     * Attach a user to a task.
     *
     * Example: POST /{project}/kanban/tasks/{task}/users.
     */
    public function attach(string $project, Task $task, Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if ($task->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User already assigned to task'], 400);
        }

        $task->users()->attach($request->user_id);

        broadcast(new TaskAssignedUser($request->user_id, $task->id))->toOthers();

        return redirect()->back()->with('success', 'User assigned to task successfully');
    }

    /**
     * Detach a user from a task.
     *
     * Example: DELETE /{project}/kanban/tasks/{task}/users/{user}.
     */
    public function detach(string $project, Task $task, User $user): RedirectResponse
    {
        $task->users()->detach($user->id);

        broadcast(new TaskAssignedUser($user->id, $task->id))->toOthers();

        return back();
    }
}
