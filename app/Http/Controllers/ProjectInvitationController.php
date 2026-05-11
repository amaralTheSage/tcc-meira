<?php

namespace App\Http\Controllers;

use App\Enums\ProjectInvitationStatus;
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

        if ($invitation->status !== ProjectInvitationStatus::PENDING) {
            return back()->with('message', "Invitation {$invitation->id} is not pending.");
        }

        $invitation->project->members()->syncWithoutDetaching([$request->user()->id]);
        $collaborations->recordProjectMembership($invitation->project_id, $request->user()->id);
        $invitation->update(['status' => ProjectInvitationStatus::ACCEPTED, 'accepted_at' => now()]);

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

        if ($invitation->status === ProjectInvitationStatus::PENDING) {
            $invitation->update(['status' => ProjectInvitationStatus::DECLINED, 'declined_at' => now()]);
        }

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
}
