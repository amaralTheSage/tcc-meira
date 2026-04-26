<?php

namespace App\Http\Controllers;

use App\Events\SubtaskAssignedUser;
use App\Models\Subtask;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SubtaskUserController extends Controller
{
    /**
     * Attach a user to a subtask.
     *
     * Example: POST /{project}/kanban/subtasks/{subtask}/users.
     */
    public function attach(string $project, Subtask $subtask, Request $request): JsonResponse|RedirectResponse
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

    /**
     * Detach a user from a subtask.
     *
     * Example: DELETE /{project}/kanban/subtasks/{subtask}/users/{user}.
     */
    public function detach(string $project, Subtask $subtask, User $user): RedirectResponse
    {
        $subtask->users()->detach($user->id);

        broadcast(new SubtaskAssignedUser($user->id, $subtask->id))->toOthers();

        return back();
    }
}
