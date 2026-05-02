<?php

namespace App\Services;

use App\Enums\ProjectInvitationStatus;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;

class ProjectMemberInvitationService
{
    /**
     * Invite many users to a project through pending project invitations.
     *
     * Example: $service->inviteUsers($project, $owner, [2, 3], $notifications).
     *
     * @param  array<int, int>  $selectedUserIds
     */
    public function inviteUsers(Project $project, User $inviter, array $selectedUserIds, NotificationService $notifications): void
    {
        User::whereKey($this->inviteeIds($selectedUserIds, $inviter->id))
            ->get()
            ->each(fn (User $invitee) => $this->inviteUser($project, $inviter, $invitee, $notifications));
    }

    /**
     * Invite one user to a project and notify them.
     *
     * Example: $service->inviteUser($project, $owner, $invitee, $notifications).
     */
    public function inviteUser(Project $project, User $inviter, User $invitee, NotificationService $notifications): ProjectInvitation
    {
        $invitation = $this->createProjectInvitation($project, $inviter->id, $invitee->id);
        $notifications->sendProjectInvite($invitation);

        return $invitation;
    }

    /**
     * @param  array<int, int>  $selectedUserIds
     * @return array<int, int>
     */
    private function inviteeIds(array $selectedUserIds, int $inviterId): array
    {
        return collect($selectedUserIds)
            ->unique()
            ->reject(fn (int $userId): bool => $userId === $inviterId)
            ->values()
            ->all();
    }

    private function createProjectInvitation(Project $project, int $inviterId, int $inviteeId): ProjectInvitation
    {
        return ProjectInvitation::updateOrCreate([
            'project_id' => $project->id,
            'invitee_id' => $inviteeId,
        ], [
            'inviter_id' => $inviterId,
            'status' => ProjectInvitationStatus::PENDING->value,
            'accepted_at' => null,
            'declined_at' => null,
        ]);
    }
}
