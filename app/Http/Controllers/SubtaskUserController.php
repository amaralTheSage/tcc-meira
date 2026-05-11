<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Events\SubtaskAssignedUser;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ProjectUndo\ProjectUndoRecorder;
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
    public function attach(Project $project, Subtask $subtask, Request $request, NotificationService $notifications, ProjectUndoRecorder $undo): JsonResponse|RedirectResponse
    {
        $this->ensureSubtaskBelongsToProject($project, $subtask);

        $request->validate([
            'user_id' => ['required', 'integer', $this->projectMemberRule($project)],
        ]);

        $assignee = User::findOrFail($request->user_id);

        if ($subtask->users()->where('user_id', $assignee->id)->exists()) {
            return response()->json(['message' => 'User already assigned to subtask'], 400);
        }

        $subtask->users()->attach($assignee->id);
        $notifications->sendSubtaskAssigned($assignee, $request->user(), $project, $subtask->task, $subtask);
        $undo->recordRelation($project, $request->user(), ProjectUndoActionType::ATTACH_SUBTASK_USER, 'Assign subtask member', [
            'relation' => 'subtask_user',
            'keys' => ['subtask_id' => $subtask->id, 'user_id' => $assignee->id],
            'after_exists' => true,
        ]);

        broadcast(new SubtaskAssignedUser($project->id, $subtask->task_id, $subtask->id, $assignee, true))->toOthers();

        return redirect()->back()->with('success', 'User assigned to subtask successfully');
    }

    /**
     * Detach a user from a subtask.
     *
     * Example: DELETE /{project}/kanban/subtasks/{subtask}/users/{user}.
     */
    public function detach(Project $project, Subtask $subtask, User $user, Request $request, ProjectUndoRecorder $undo): RedirectResponse
    {
        $this->ensureSubtaskBelongsToProject($project, $subtask);
        $this->ensureUserBelongsToProject($project, $user);

        $wasAssigned = $subtask->users()->where('user_id', $user->id)->exists();
        $subtask->users()->detach($user->id);

        if ($wasAssigned) {
            $undo->recordRelation($project, $request->user(), ProjectUndoActionType::DETACH_SUBTASK_USER, 'Remove subtask member', [
                'relation' => 'subtask_user',
                'keys' => ['subtask_id' => $subtask->id, 'user_id' => $user->id],
                'after_exists' => false,
            ]);
        }

        broadcast(new SubtaskAssignedUser($project->id, $subtask->task_id, $subtask->id, $user, false))->toOthers();

        return back();
    }

    private function projectMemberRule(Project $project): Exists
    {
        return Rule::exists('project_user', 'user_id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }
}
