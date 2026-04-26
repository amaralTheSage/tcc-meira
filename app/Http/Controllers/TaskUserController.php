<?php

namespace App\Http\Controllers;

use App\Events\TaskAssignedUser;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class TaskUserController extends Controller
{
    public function attach($project, Task $task, Request $request)
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

    public function detach($project, Task $task, User $user)
    {
        $task->users()->detach($user->id);

        broadcast(new TaskAssignedUser($user->user_id, $task->id))->toOthers();

        return back();
    }
}
