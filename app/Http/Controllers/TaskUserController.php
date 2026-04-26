<?php

namespace App\Http\Controllers;

use App\Events\TaskAssignedUser;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class TaskUserController extends Controller
{
    use GuardsProjectResources;

    /**
     * Attach a user to a task.
     *
     * Example: POST /{project}/kanban/tasks/{task}/users.
     */
    public function attach(Project $project, Task $task, Request $request): JsonResponse|RedirectResponse
    {
        $this->ensureTaskBelongsToProject($project, $task);

        $request->validate([
            'user_id' => ['required', 'integer', $this->projectMemberRule($project)],
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
    public function detach(Project $project, Task $task, User $user): RedirectResponse
    {
        $this->ensureTaskBelongsToProject($project, $task);
        $this->ensureUserBelongsToProject($project, $user);

        $task->users()->detach($user->id);

        broadcast(new TaskAssignedUser($user->id, $task->id))->toOthers();

        return back();
    }

    private function projectMemberRule(Project $project): Exists
    {
        return Rule::exists('project_user', 'user_id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }
}
