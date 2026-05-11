<?php

namespace App\Http\Controllers;

use App\Enums\ProjectInvitationStatus;
use App\Models\Project;
use App\Models\User;
use App\Services\CollaborationHistoryService;
use App\Services\NotificationService;
use App\Services\ProjectMemberInvitationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectMemberController extends Controller
{
    /**
     * Search users who can be invited to the project.
     *
     * Example: GET /{project}/members/search?search=ada.
     */
    public function search(Project $project, Request $request, CollaborationHistoryService $collaborations): JsonResponse
    {
        return response()->json(
            $collaborations
                ->rankUsersFor($request->user(), $this->inviteCandidates($project, $request))
                ->limit(20)
                ->get()
        );
    }

    /**
     * Send a project invitation to a non-member.
     *
     * Example: POST /{project}/members/invitations with user_id.
     */
    public function invite(
        Project $project,
        Request $request,
        NotificationService $notifications,
        ProjectMemberInvitationService $invitations,
    ): RedirectResponse {
        $validated = $request->validate(['user_id' => ['required', 'integer', 'exists:users,id']]);
        $invitee = User::findOrFail($validated['user_id']);

        if ($this->cannotInvite($project, $request->user(), $invitee)) {
            return back()->withErrors(['user_id' => 'Choose a user who is not already in this project or pending an invite.']);
        }

        $invitations->inviteUser($project, $request->user(), $invitee, $notifications);

        return back()->with('success', 'Project invitation sent.');
    }

    /**
     * Remove a member from the project and clear their assignments.
     *
     * Example: DELETE /{project}/members/{user}.
     */
    public function destroy(Project $project, User $user, Request $request): RedirectResponse
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return back()->withErrors(['member' => 'You cannot remove yourself from this project.']);
        }

        abort_unless($project->members()->whereKey($user->id)->exists(), 404);

        if ($project->members()->count() <= 1) {
            return back()->withErrors(['member' => 'A project must keep at least one member.']);
        }

        $this->removeProjectMember($project, $user);

        return back()->with('success', 'Project member removed.');
    }

    private function inviteCandidates(Project $project, Request $request): Builder
    {
        $search = $this->searchTerm($request);

        return User::query()
            ->where('users.id', '!=', $request->user()->id)
            ->whereNotIn('users.id', $project->members()->select('users.id'))
            ->whereNotIn('users.id', $this->pendingInviteeIds($project))
            ->when($search !== '', fn (Builder $query): Builder => $this->applySearch($query, $search));
    }

    private function cannotInvite(Project $project, User $inviter, User $invitee): bool
    {
        return $inviter->id === $invitee->id
            || $project->members()->whereKey($invitee->id)->exists()
            || in_array($invitee->id, $this->pendingInviteeIds($project), true);
    }

    private function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(fn (Builder $userQuery): Builder => $userQuery
            ->whereRaw('LOWER(users.name) LIKE ?', ["%{$search}%"])
            ->orWhereRaw('LOWER(users.email) LIKE ?', ["%{$search}%"]));
    }

    private function searchTerm(Request $request): string
    {
        return $request->string('search')->lower()->toString();
    }

    /**
     * @return array<int, int>
     */
    private function pendingInviteeIds(Project $project): array
    {
        return $project->invitations()
            ->where('status', ProjectInvitationStatus::PENDING->value)
            ->pluck('invitee_id')
            ->all();
    }

    private function removeProjectMember(Project $project, User $user): void
    {
        DB::transaction(function () use ($project, $user): void {
            $taskIds = $project->tasks()->pluck('id');
            DB::table('task_user')->where('user_id', $user->id)->whereIn('task_id', $taskIds)->delete();
            $this->deleteSubtaskAssignments($taskIds->all(), $user);
            $project->members()->detach($user->id);
        });
    }

    /**
     * @param  array<int, string|int>  $taskIds
     */
    private function deleteSubtaskAssignments(array $taskIds, User $user): void
    {
        $subtaskIds = DB::table('subtasks')->whereIn('task_id', $taskIds)->pluck('id');

        DB::table('subtask_user')
            ->where('user_id', $user->id)
            ->whereIn('subtask_id', $subtaskIds)
            ->delete();
    }
}
