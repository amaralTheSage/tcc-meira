<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class TaskUserController extends Controller
{
    public function attach(Task $task, Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        // Verifica se o usuário já está associado à tarefa
        if ($task->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User already assigned to task'], 400);
        }

        $task->users()->attach($request->user_id);

        return response()->json(['message' => 'User assigned to task successfully']);
    }

    public function detach(Task $task, User $user)
    {
        $task->users()->detach($user->id);

        return response()->json(['message' => 'User removed from task successfully']);
    }
}
