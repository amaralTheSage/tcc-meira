<?php

use App\Enums\ProjectInvitationStatus;
use App\Models\ProjectInvitation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\Support\BackendFixtures as Backend;

it('records directed collaboration rows when project members are attached', function () {
    [$owner, $project] = Backend::projectWithMember();
    $member = Backend::projectMember($project);

    expect(collaborationExists($project->id, $owner->id, $member->id))->toBeTrue();
    expect(collaborationExists($project->id, $member->id, $owner->id))->toBeTrue();
});

it('records collaboration history when project invitations are accepted', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $invitation = ProjectInvitation::create([
        'project_id' => $project->id,
        'inviter_id' => $owner->id,
        'invitee_id' => $invitee->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);

    $this->actingAs($invitee)
        ->post(route('project-invitations.accept', $invitation))
        ->assertRedirect(route('traceboard', $project));

    expect(collaborationExists($project->id, $owner->id, $invitee->id))->toBeTrue();
});

it('keeps removed members prioritized in later project invite search', function () {
    [$owner, $project] = Backend::projectWithMember();
    $formerMember = Backend::projectMember($project, ['name' => 'Ana Former']);
    $project->members()->detach($formerMember->id);
    [, $nextProject] = Backend::projectWithMember($owner);
    User::factory()->create(['name' => 'Ana Active']);

    $this->actingAs($owner)
        ->get(route('project-members.search', [$nextProject, 'search' => 'ana']))
        ->assertOk()
        ->assertJsonPath('0.id', $formerMember->id)
        ->assertJsonPath('0.has_collaborated', true);
});

it('does not treat pending project invitations as collaboration history', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create(['name' => 'Ana Pending']);
    ProjectInvitation::create([
        'project_id' => $project->id,
        'inviter_id' => $owner->id,
        'invitee_id' => $invitee->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);

    $this->actingAs($owner)
        ->get(route('users.search', ['search' => 'ana']))
        ->assertOk()
        ->assertJsonPath('0.id', $invitee->id)
        ->assertJsonPath('0.has_collaborated', false);
});

function collaborationExists(string $projectId, int $userId, int $collaboratorId): bool
{
    return DB::table('project_collaborations')
        ->where('project_id', $projectId)
        ->where('user_id', $userId)
        ->where('collaborator_id', $collaboratorId)
        ->exists();
}
