<?php

use App\Events\CursorMoved;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Events\TaskConnectionChanged;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\Support\BackendFixtures as Backend;

it('creates traceboard notes and broadcasts them', function () {
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->post(route('notes.store', $project), [
            'id' => 'note-a',
            'x' => 10,
            'y' => 20,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('notes', [
        'id' => 'note-a',
        'project_id' => $project->id,
    ]);
    Event::assertDispatched(NodeAdded::class);
});

it('keeps existing notes when store repeats the same id', function () {
    [$user, $project] = Backend::projectWithMember();
    $note = Backend::note($project, ['id' => 'note-repeat', 'text' => 'Keep me', 'x' => 10, 'y' => 20]);
    Event::fake();

    $this->actingAs($user)
        ->post(route('notes.store', $project), [
            'id' => $note->id,
            'x' => 100,
            'y' => 200,
        ])
        ->assertSessionHasNoErrors();

    expect(Note::whereKey($note->id)->count())->toBe(1);
    expect($note->fresh())
        ->text->toBe('Keep me')
        ->x->toBe(10.0)
        ->y->toBe(20.0);
});

it('validates traceboard note creation payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('notes.store', $project), ['x' => 'left'])
        ->assertSessionHasErrors(['id', 'x', 'y']);
});

it('updates and moves traceboard notes', function () {
    [$user, $project] = Backend::projectWithMember();
    $note = Backend::note($project, ['text' => 'Old']);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('notes.update', [$project, $note]), ['text' => 'New'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->patch(route('notes.move', [$project, $note]), ['x' => 111, 'y' => 222])
        ->assertSessionHasNoErrors();

    expect($note->fresh())
        ->text->toBe('New')
        ->x->toBe(111.0)
        ->y->toBe(222.0);

    Event::assertDispatched(NodeRenamed::class);
    Event::assertDispatched(NodeDragged::class);
});

it('updates moves and deletes prefixed legacy note ids', function () {
    [$user, $project] = Backend::projectWithMember();
    $noteId = 'legacy-project_123e4567-e89b-12d3-a456-426614174000';
    Event::fake();

    $this->actingAs($user)
        ->post(route('notes.store', $project), ['id' => $noteId, 'x' => 10, 'y' => 20])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->patch(route('notes.update', [$project, $noteId]), ['text' => 'Legacy text'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->patch(route('notes.move', [$project, $noteId]), ['x' => 333, 'y' => 444])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->delete(route('notes.destroy', [$project, $noteId]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('notes', ['id' => $noteId]);
    Event::assertDispatched(NodeAdded::class, fn (NodeAdded $event) => $event->node_id === $noteId);
    Event::assertDispatched(NodeRenamed::class, fn (NodeRenamed $event) => $event->task_id === $noteId);
    Event::assertDispatched(NodeDragged::class, fn (NodeDragged $event) => $event->node_id === $noteId);
    Event::assertDispatched(NodeRemoved::class, fn (NodeRemoved $event) => $event->task_id === $noteId);
});

it('creates missing note ids when updates or moves arrive before store', function () {
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->patch(route('notes.update', [$project, 'client-note-update-first']), ['text' => 'Draft note'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->patch(route('notes.move', [$project, 'client-note-move-first']), ['x' => 111, 'y' => 222])
        ->assertSessionHasNoErrors();

    expect(Note::findOrFail('client-note-update-first'))
        ->project_id->toBe($project->id)
        ->text->toBe('Draft note')
        ->x->toBe(0.0)
        ->y->toBe(0.0);
    expect(Note::findOrFail('client-note-move-first'))
        ->project_id->toBe($project->id)
        ->x->toBe(111.0)
        ->y->toBe(222.0);
});

it('validates traceboard note updates and moves', function () {
    [$user, $project] = Backend::projectWithMember();
    $note = Backend::note($project);

    $this->actingAs($user)
        ->patch(route('notes.update', [$project, $note]), [
            'text' => str_repeat('a', 136),
            'x' => 'left',
        ])
        ->assertSessionHasErrors(['text', 'x']);

    $this->actingAs($user)
        ->patch(route('notes.move', [$project, $note]), ['x' => 1])
        ->assertSessionHasErrors(['y']);
});

it('deletes traceboard notes and broadcasts removal', function () {
    [$user, $project] = Backend::projectWithMember();
    $note = Backend::note($project);
    Event::fake();

    $this->actingAs($user)
        ->delete(route('notes.destroy', [$project, $note]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    Event::assertDispatched(NodeRemoved::class);

    $this->actingAs($user)
        ->delete(route('notes.destroy', [$project, 'missing-note']))
        ->assertSessionHasNoErrors();
});

it('rejects note mutations for notes from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignProject = Project::factory()->create();
    $foreignNote = Backend::note($foreignProject, ['text' => 'Foreign']);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('notes.update', [$project, $foreignNote]), ['text' => 'Stolen'])
        ->assertNotFound();

    $this->actingAs($user)
        ->patch(route('notes.move', [$project, $foreignNote]), ['x' => 1, 'y' => 2])
        ->assertNotFound();

    $this->actingAs($user)
        ->delete(route('notes.destroy', [$project, $foreignNote]))
        ->assertNotFound();

    $this->actingAs($user)
        ->post(route('notes.store', $project), ['id' => (string) $foreignNote->id, 'x' => 1, 'y' => 2])
        ->assertNotFound();

    expect($foreignNote->fresh()->text)->toBe('Foreign');
});

it('connects and disconnects tasks within a project', function () {
    [$user, $project] = Backend::projectWithMember();
    $source = Backend::task($project, ['id' => 'source']);
    $target = Backend::task($project, ['id' => 'target']);

    $payload = ['source_id' => $source->id, 'target_id' => $target->id];
    Event::fake();

    $this->actingAs($user)
        ->post(route('tasks.connect', $project), $payload)
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('task_connections', $payload);
    Event::assertDispatched(
        TaskConnectionChanged::class,
        fn (TaskConnectionChanged $event) => $event->sourceId === $source->id && $event->targetId === $target->id && $event->connected === true
    );

    $this->actingAs($user)
        ->post(route('tasks.disconnect', $project), $payload)
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('task_connections', $payload);
    Event::assertDispatched(
        TaskConnectionChanged::class,
        fn (TaskConnectionChanged $event) => $event->sourceId === $source->id && $event->targetId === $target->id && $event->connected === false
    );
});

it('validates task connection payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('tasks.connect', $project), [
            'source_id' => 'missing-source',
            'target_id' => '',
        ])
        ->assertSessionHasErrors(['source_id', 'target_id']);
});

it('rejects cross-project task connections', function () {
    [$user, $project] = Backend::projectWithMember();
    $source = Backend::task($project, ['id' => 'local-source']);
    $foreignTask = Backend::task(Project::factory()->create(), ['id' => 'foreign-target']);

    $payload = ['source_id' => $source->id, 'target_id' => $foreignTask->id];

    $this->actingAs($user)
        ->post(route('tasks.connect', $project), $payload)
        ->assertNotFound();

    expect(DB::table('task_connections')->where($payload)->exists())->toBeFalse();
});

it('broadcasts cursor movement for valid coordinates', function () {
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->post(route('cursor', $project), ['x' => 50, 'y' => 70])
        ->assertSessionHasNoErrors();

    Event::assertDispatched(CursorMoved::class, fn (CursorMoved $event) => $event->id === $user->id);
});

it('validates cursor movement payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('cursor', $project), ['x' => 'left'])
        ->assertSessionHasErrors(['x', 'y']);
});
