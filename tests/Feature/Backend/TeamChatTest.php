<?php

use App\Events\MessageAdded;
use App\Models\Message;
use App\Models\Project;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
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
