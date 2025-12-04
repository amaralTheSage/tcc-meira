<?php

namespace App\Http\Controllers;

use App\Models\Subtask;
use App\Models\User;
use Illuminate\Http\Request;
use App\Events\SubtaskAssignedUser;

class SubtaskUserController extends Controller
{
    public function attach($project, Subtask $subtask, Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        if ($subtask->users()->where('user_id', $request->user_id)->exists()) {
            return response()->json(['message' => 'User already assigned to subtask'], 400);
        }

        $subtask->users()->attach($request->user_id);

        broadcast(new SubtaskAssignedUser($request->user_id, $subtask->id))->toOthers();

        return redirect()->back()->with('success', 'User assigned to subtask successfully');
    }

    public function detach($project, Subtask $subtask, User $user)
    {
        $subtask->users()->detach($user->id);

        broadcast(new SubtaskAssignedUser($user->id, $subtask->id))->toOthers();

        return back();
    }
}
