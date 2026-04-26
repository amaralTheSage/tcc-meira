<?php

namespace App\Http\Controllers;

use App\Events\SubtaskAssignedUser;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class SubtaskUserController extends Controller
{
    use GuardsProjectResources;

    /**
     * Attach a user to a subtask.
     *
     * Example: POST /{project}/kanban/subtasks/{subtask}/users.
     */
    public function attach(Project $project, Subtask $subtask, Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureSubtaskBelongsToProject($project, $subtask);

        $request->validate([
            'user_id' => ['required', 'integer', $this->projectMemberRule($project)],
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
    public function detach(Project $project, Subtask $subtask, User $user): RedirectResponse
    {
        $this->ensureSubtaskBelongsToProject($project, $subtask);
        $this->ensureUserBelongsToProject($project, $user);

        $subtask->users()->detach($user->id);

        broadcast(new SubtaskAssignedUser($user->id, $subtask->id))->toOthers();

        return back();
    }

    private function projectMemberRule(Project $project): Exists
    {
        return Rule::exists('project_user', 'user_id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }
}
