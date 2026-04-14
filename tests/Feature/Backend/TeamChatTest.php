<?php

use App\Enums\NotificationType;
use App\Events\MessageAdded;
use App\Events\MessageDeleted;
use App\Events\MessageUpdated;
use App\Models\Message;
use App\Models\Project;
use App\Notifications\ProjectActionNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders team chat messages in chronological order with users', function () {
    [$user, $project] = Backend::projectWithMember();
    $older = Backend::message($project, $user, ['content' => 'Older']);
    $newer = Backend::message($project, $user, ['content' => 'Newer']);

    Message::whereKey($older->id)->update(['created_at' => now()->subMinute()]);
    Message::whereKey($newer->id)->update(['created_at' => now()]);

    $this->actingAs($user)
        ->get(route('team-chat', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/team-chat')
            ->where('project.chat.messages.0.content', 'Older')
            ->where('project.chat.messages.1.content', 'Newer')
            ->where('project.chat.messages.0.user.id', $user->id)
        );
});

it('stores text chat messages and broadcasts them', function () {
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => Backend::chat($project)->id,
            'user_id' => $user->id,
            'content' => 'Backend tests are ready',
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('messages', [
        'chat_id' => Backend::chat($project)->id,
        'user_id' => $user->id,
        'content' => 'Backend tests are ready',
    ]);
    Event::assertDispatched(MessageAdded::class);
});

it('sends notifications for explicit chat mentions', function () {
    Notification::fake();
    [$user, $project] = Backend::projectWithMember();
    $mentionedUser = Backend::projectMember($project);

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => Backend::chat($project)->id,
            'content' => "@{$mentionedUser->name} please review this",
            'mentioned_user_ids' => [$mentionedUser->id],
        ])
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($mentionedUser, ProjectActionNotification::class, function (ProjectActionNotification $notification) {
        return $notification->payload()['type'] === NotificationType::CHAT_MENTION->value;
    });
});

it('edits and deletes messages authored by the current user', function () {
    [$user, $project] = Backend::projectWithMember();
    $message = Backend::message($project, $user, ['content' => 'Draft']);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('message.update', [$project, $message]), ['content' => 'Updated draft'])
        ->assertSessionHasNoErrors();

    expect($message->fresh())->content->toBe('Updated draft')->edited_at->not->toBeNull();
    Event::assertDispatched(MessageUpdated::class);

    $this->actingAs($user)
        ->delete(route('message.destroy', [$project, $message]))
        ->assertSessionHasNoErrors();

    expect(Message::withTrashed()->findOrFail($message->id)->trashed())->toBeTrue();
    Event::assertDispatched(MessageDeleted::class);
});

it('rejects editing messages owned by another member', function () {
    [$user, $project] = Backend::projectWithMember();
    $otherMember = Backend::projectMember($project);
    $message = Backend::message($project, $otherMember, ['content' => 'Private edit']);

    $this->actingAs($user)
        ->patch(route('message.update', [$project, $message]), ['content' => 'Stolen'])
        ->assertForbidden();

    expect($message->fresh()->content)->toBe('Private edit');
});

it('stores chat message images on the public disk', function () {
    Storage::fake('public');
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => Backend::chat($project)->id,
            'user_id' => $user->id,
            'content' => '',
            'image' => UploadedFile::fake()->image('chat.png'),
        ])
        ->assertSessionHasNoErrors();

    expect(Storage::disk('public')->allFiles('messages'))->toHaveCount(1);
    expect(Message::firstOrFail()->image)->toStartWith('messages/');
});

it('validates chat message payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => 999,
            'user_id' => 999,
            'content' => str_repeat('a', 1001),
            'image' => UploadedFile::fake()->create('payload.pdf', 1, 'application/pdf'),
        ])
        ->assertSessionHasErrors(['chat_id', 'user_id', 'content', 'image']);
});

it('uses the authenticated user as message author', function () {
    [$user, $project] = Backend::projectWithMember();
    $otherMember = Backend::projectMember($project);
    Event::fake();

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => Backend::chat($project)->id,
            'user_id' => $otherMember->id,
            'content' => 'Do not spoof me',
        ])
        ->assertSessionHasNoErrors();

    expect(Message::firstOrFail()->user_id)->toBe($user->id);
});

it('rejects messages posted to another project chat', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignProject = Project::factory()->create();
    Event::fake();

    $this->actingAs($user)
        ->post(route('message.store', $project), [
            'chat_id' => Backend::chat($foreignProject)->id,
            'user_id' => $user->id,
            'content' => 'Foreign chat',
        ])
        ->assertNotFound();

    expect(Message::where('content', 'Foreign chat')->exists())->toBeFalse();
});
