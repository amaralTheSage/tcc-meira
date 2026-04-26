<?php

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Events\TaskDescription;
use App\Events\TaskImageUpdated;
use App\Events\TaskMoved;
use App\Models\Project;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders the traceboard with project collaboration data', function () {
    [$user, $project] = Backend::projectWithMember();
    Backend::task($project, ['title' => 'Map API']);
    Backend::note($project, ['text' => 'Remember auth']);
    Backend::tag($project, ['name' => 'Backend']);
    Backend::sprint($project, ['title' => 'Sprint Alpha']);

    $this->actingAs($user)
        ->get(route('traceboard', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/traceboard')
            ->has('project.tasks', 1)
            ->has('project.notes', 1)
            ->has('project.tags', 1)
            ->has('project.sprints', 1)
        );
});

it('stores a task in the project backlog and broadcasts it', function () {
    [$user, $project] = Backend::projectWithMember();
    $backlog = Backend::defaultColumn($project, ColumnType::BACKLOG);
    Event::fake();

    $this->actingAs($user)
        ->post(route('tasks.store', $project), [
            'id' => 'task-a',
            'title' => 'Design API',
            'x' => 100,
            'y' => 200,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('tasks', [
        'id' => 'task-a',
        'project_id' => $project->id,
        'column_id' => $backlog->id,
    ]);

    Event::assertDispatched(NodeAdded::class, fn (NodeAdded $event) => $event->node_id === 'task-a');
});

it('validates task creation payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('tasks.store', $project), [
            'title' => str_repeat('a', 136),
            'x' => 'left',
            'y' => null,
        ])
        ->assertSessionHasErrors(['id', 'title', 'x', 'y']);
});

it('updates task metadata and emits matching broadcasts', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $column = Backend::defaultColumn($project, ColumnType::IN_PROGRESS);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'title' => 'Build API',
            'description' => 'Document the backend contract',
            'position' => 7,
            'column_id' => (string) $column->id,
            'status' => Status::IN_PROGRESS->value,
        ])
        ->assertSessionHasNoErrors();

    expect($task->fresh())
        ->title->toBe('Build API')
        ->description->toBe('Document the backend contract')
        ->position->toBe(7);

    Event::assertDispatched(NodeRenamed::class);
    Event::assertDispatched(TaskMoved::class);
    Event::assertDispatched(TaskDescription::class);
});

it('accepts real sprint ids when assigning tasks to sprints', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $sprint = Backend::sprint($project);

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'sprint_id' => $sprint->id,
        ])
        ->assertSessionHasNoErrors();

    expect($task->fresh()->sprint_id)->toBe($sprint->id);
});

it('stores uploaded task images and supports removing them', function () {
    Storage::fake('public');
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'image' => UploadedFile::fake()->image('diagram.png'),
        ])
        ->assertSessionHasNoErrors();

    expect($task->fresh()->image)->toContain('/storage/projects/'.$project->id);
    expect(Storage::disk('public')->allFiles('projects/'.$project->id))->toHaveCount(1);
    Event::assertDispatched(TaskImageUpdated::class);

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), ['image_link' => 'REMOVE_IMAGE'])
        ->assertSessionHasNoErrors();

    expect($task->fresh()->image)->toBeNull();
});

it('validates task update payloads', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'title' => str_repeat('a', 136),
            'status' => 'done',
            'x' => 'left',
        ])
        ->assertSessionHasErrors(['title', 'status', 'x']);
});

it('completes all subtasks when a task is completed', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $firstSubtask = Backend::subtask($task);
    $secondSubtask = Backend::subtask($task);

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'status' => Status::COMPLETED->value,
        ])
        ->assertSessionHasNoErrors();

    expect($firstSubtask->fresh()->completed)->toBe(1);
    expect($secondSubtask->fresh()->completed)->toBe(1);
});

it('completes all subtasks when a task moves to the done column', function () {
    [$user, $project] = Backend::projectWithMember();
    $done = Backend::defaultColumn($project, ColumnType::DONE);
    $task = Backend::task($project);
    $subtask = Backend::subtask($task);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $task]), [
            'column_id' => (string) $done->id,
        ])
        ->assertSessionHasNoErrors();

    expect($subtask->fresh()->completed)->toBe(1);
});

it('moves task coordinates and broadcasts the user drag', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.move', [$project, $task]), ['x' => 321, 'y' => 654])
        ->assertSessionHasNoErrors();

    $freshTask = $task->fresh();

    expect((int) $freshTask->x)->toBe(321);
    expect((int) $freshTask->y)->toBe(654);
    Event::assertDispatched(NodeDragged::class, fn (NodeDragged $event) => $event->userId === $user->id);
});

it('marks a task complete through the dedicated endpoint', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['status' => Status::PENDING->value]);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.complete', [$project, $task]))
        ->assertSessionHasNoErrors();

    expect($task->fresh()->status)->toBe(Status::COMPLETED->value);
    Event::assertDispatched(TaskMoved::class);
});

it('deletes existing tasks and tolerates already missing ids', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    Event::fake();

    $this->actingAs($user)
        ->delete(route('tasks.destroy', [$project, $task->id]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    Event::assertDispatched(NodeRemoved::class);

    $this->actingAs($user)
        ->delete(route('tasks.destroy', [$project, 'missing-task']))
        ->assertSessionHasNoErrors();
});

it('rejects task mutations for resources from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $otherProject = Project::factory()->create();
    $foreignTask = Backend::task($otherProject, ['title' => 'Foreign']);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('tasks.update', [$project, $foreignTask]), ['title' => 'Stolen'])
        ->assertNotFound();

    expect($foreignTask->fresh()->title)->toBe('Foreign');
});
