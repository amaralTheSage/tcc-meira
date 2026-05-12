<?php

namespace App\Http\Controllers;

use App\Enums\NotificationType;
use App\Enums\ProjectInvitationStatus;
use App\Models\DatabaseNotification;
use App\Models\ProjectInvitation;
use App\Services\CollaborationHistoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectInvitationController extends Controller
{
    /**
     * Accept a pending project invitation and join the project.
     *
     * Example: POST /project-invitations/{invitation}/accept.
     */
    public function accept(Request $request, ProjectInvitation $invitation, CollaborationHistoryService $collaborations): RedirectResponse
    {
        $this->ensureInvitationBelongsToUser($request, $invitation);
        $notification = $this->invitationNotificationFromRequest($request, $invitation);

        if ($invitation->status !== ProjectInvitationStatus::PENDING) {
            $notification?->delete();

            return back()->with('message', "Invitation {$invitation->id} is not pending.");
        }

        $invitation->project->members()->syncWithoutDetaching([$request->user()->id]);
        $collaborations->recordProjectMembership($invitation->project_id, $request->user()->id);
        $invitation->update(['status' => ProjectInvitationStatus::ACCEPTED, 'accepted_at' => now()]);
        $notification?->delete();

        return redirect()->route('traceboard', $invitation->project);
    }

    /**
     * Decline a pending project invitation without joining the project.
     *
     * Example: POST /project-invitations/{invitation}/decline.
     */
    public function decline(Request $request, ProjectInvitation $invitation): RedirectResponse
    {
        $this->ensureInvitationBelongsToUser($request, $invitation);
        $notification = $this->invitationNotificationFromRequest($request, $invitation);

        if ($invitation->status === ProjectInvitationStatus::PENDING) {
            $invitation->update(['status' => ProjectInvitationStatus::DECLINED, 'declined_at' => now()]);
        }

        $notification?->delete();

        return back();
    }

    private function ensureInvitationBelongsToUser(Request $request, ProjectInvitation $invitation): void
    {
        abort_unless(
            $invitation->invitee_id === $request->user()->id,
            403,
            "Invitation {$invitation->id} must belong to user {$request->user()->id}."
        );
    }

    private function invitationNotificationFromRequest(Request $request, ProjectInvitation $invitation): ?DatabaseNotification
    {
        $notificationId = $request->input('notification_id');
        if ($notificationId === null || $notificationId === '') {
            return null;
        }

        abort_unless(is_string($notificationId), 422, 'Notification id must be a string; received '.json_encode($notificationId).'.');
        $notification = $request->user()->notifications()->whereKey($notificationId)->firstOrFail();
        abort_unless($this->notificationMatchesInvitation($notification, $invitation), 422, "Notification {$notificationId} must be a project invite for invitation {$invitation->id}.");

        return $notification;
    }

    private function notificationMatchesInvitation(DatabaseNotification $notification, ProjectInvitation $invitation): bool
    {
        $notificationType = $notification->data['type'] ?? null;
        $invitationId = $notification->data['context']['invitation']['id'] ?? null;

        return $notificationType === NotificationType::PROJECT_INVITE->value
            && $invitationId === $invitation->id;
    }
}
