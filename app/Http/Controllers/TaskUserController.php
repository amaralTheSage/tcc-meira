<?php

namespace App\Http\Controllers;

use App\Events\TaskAssignedUser;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
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
    public function attach(Project $project, Task $task, Request $request, NotificationService $notifications): JsonResponse|RedirectResponse
    {
        $this->ensureTaskBelongsToProject($project, $task);

        $request->validate([
            'user_id' => ['required', 'integer', $this->projectMemberRule($project)],
        ]);

        $assignee = User::findOrFail($request->user_id);

        if ($task->users()->where('user_id', $assignee->id)->exists()) {
            return response()->json(['message' => 'User already assigned to task'], 400);
        }

        $task->users()->attach($assignee->id);
        $notifications->sendTaskAssigned($assignee, $request->user(), $project, $task);

        broadcast(new TaskAssignedUser($project->id, $task->id, $assignee, true))->toOthers();

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

        broadcast(new TaskAssignedUser($project->id, $task->id, $user, false))->toOthers();

        return back();
    }

    private function projectMemberRule(Project $project): Exists
    {
        return Rule::exists('project_user', 'user_id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }
}
