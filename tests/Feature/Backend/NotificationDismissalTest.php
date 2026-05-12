<?php

use App\Enums\NotificationType;
use App\Enums\ProjectInvitationStatus;
use App\Models\DatabaseNotification;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Services\NotificationFeed;
use Illuminate\Support\Str;
use Tests\Support\BackendFixtures as Backend;

it('soft-deletes only authenticated user notifications', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $notification = storedNotification($user, NotificationType::CHAT_MENTION);
    $otherNotification = storedNotification($otherUser, NotificationType::CHAT_MENTION);

    $this->actingAs($user)
        ->deleteJson(route('notifications.dismiss', $notification))
        ->assertOk()
        ->assertJson(['dismissed' => true]);

    $this->actingAs($user)
        ->deleteJson(route('notifications.dismiss', $otherNotification))
        ->assertNotFound();

    expect(trashedNotification($notification)->deleted_at)->not->toBeNull();
    expect(trashedNotification($otherNotification)->deleted_at)->toBeNull();
});

it('excludes dismissed notifications from the feed and unread count', function () {
    $user = User::factory()->create();
    $visibleNotification = storedNotification($user, NotificationType::TASK_ASSIGNED);
    $dismissedNotification = storedNotification($user, NotificationType::CHAT_MENTION);
    $dismissedNotification->delete();

    $feed = app(NotificationFeed::class)->recentFor($user);

    expect($feed['items'])->toHaveCount(1);
    expect($feed['items'][0]['id'])->toBe($visibleNotification->id);
    expect($feed['unread_count'])->toBe(1);
});

it('soft-deletes matching invite notifications after accepting invitations', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $invitation = projectInvitation($owner, $invitee, $project->id);
    $notification = storedNotification($invitee, NotificationType::PROJECT_INVITE, [
        'context' => ['invitation' => ['id' => $invitation->id, 'status' => 'pending']],
    ]);

    $this->actingAs($invitee)
        ->post(route('project-invitations.accept', $invitation), ['notification_id' => $notification->id])
        ->assertRedirect(route('traceboard', $project));

    expect(trashedNotification($notification)->deleted_at)->not->toBeNull();
});

it('soft-deletes matching invite notifications after declining invitations', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $invitation = projectInvitation($owner, $invitee, $project->id);
    $notification = storedNotification($invitee, NotificationType::PROJECT_INVITE, [
        'context' => ['invitation' => ['id' => $invitation->id, 'status' => 'pending']],
    ]);

    $this->actingAs($invitee)
        ->post(route('project-invitations.decline', $invitation), ['notification_id' => $notification->id])
        ->assertRedirect();

    expect($invitation->fresh()->status)->toBe(ProjectInvitationStatus::DECLINED);
    expect(trashedNotification($notification)->deleted_at)->not->toBeNull();
});

it('rejects mismatched invite notification ids without deleting them', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $invitation = projectInvitation($owner, $invitee, $project->id);
    $notification = storedNotification($invitee, NotificationType::PROJECT_INVITE, [
        'context' => ['invitation' => ['id' => (string) Str::uuid(), 'status' => 'pending']],
    ]);

    $this->actingAs($invitee)
        ->post(route('project-invitations.accept', $invitation), ['notification_id' => $notification->id])
        ->assertStatus(422);

    expect($invitation->fresh()->status)->toBe(ProjectInvitationStatus::PENDING);
    expect(trashedNotification($notification)->deleted_at)->toBeNull();
});

function storedNotification(User $user, NotificationType $type, array $data = []): DatabaseNotification
{
    return $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => $type->value,
        'data' => array_replace_recursive(['type' => $type->value, 'message' => 'Stored notification.'], $data),
    ]);
}

function trashedNotification(DatabaseNotification $notification): DatabaseNotification
{
    return DatabaseNotification::withTrashed()->findOrFail($notification->id);
}

function projectInvitation(User $owner, User $invitee, string $projectId): ProjectInvitation
{
    return ProjectInvitation::create([
        'project_id' => $projectId,
        'inviter_id' => $owner->id,
        'invitee_id' => $invitee->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);
}
