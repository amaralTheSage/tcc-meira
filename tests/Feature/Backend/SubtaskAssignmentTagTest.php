<?php

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Events\SubtaskAdded;
use App\Events\SubtaskAssignedUser;
use App\Events\SubtaskComplete;
use App\Events\TaskAssignedUser;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Tests\Support\BackendFixtures as Backend;

it('creates subtasks with the next available position', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    Backend::subtask($task, ['position' => 4]);
    Event::fake();

    $this->actingAs($user)
        ->post(route('subtasks.store', $project), [
            'title' => 'Write migration',
            'task_id' => $task->id,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('subtasks', [
        'task_id' => $task->id,
        'title' => 'Write migration',
        'position' => 5,
    ]);
    Event::assertDispatched(SubtaskAdded::class);
});

it('ignores client supplied ids when creating subtasks', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    Event::fake();

    $this->actingAs($user)
        ->post(route('subtasks.store', $project), [
            'id' => 'client-subtask-id',
            'title' => 'Server owned id',
            'task_id' => $task->id,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('subtasks', ['id' => 'client-subtask-id']);
    $this->assertDatabaseHas('subtasks', [
        'task_id' => $task->id,
        'title' => 'Server owned id',
    ]);
});

it('validates subtask creation payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('subtasks.store', $project), [
            'title' => str_repeat('a', 51),
            'position' => 'first',
        ])
        ->assertSessionHasErrors(['title', 'position', 'task_id']);
});

it('updates subtasks and completes the parent when all subtasks are done', function () {
    [$user, $project] = Backend::projectWithMember();
    $done = Backend::defaultColumn($project, ColumnType::DONE);
    $task = Backend::task($project, ['status' => Status::PENDING->value]);
    $subtask = Backend::subtask($task, ['completed' => false]);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('subtasks.update', [$project, $subtask->id]), [
            'title' => 'Updated subtask',
            'position' => 3,
            'completed' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($subtask->fresh())
        ->title->toBe('Updated subtask')
        ->position->toBe(3)
        ->completed->toBe(1);

    expect($task->fresh())
        ->status->toBe(Status::COMPLETED->value)
        ->column_id->toBe($done->id);

    Event::assertDispatched(SubtaskComplete::class);
});

it('validates subtask update payloads', function () {
    [$user, $project] = Backend::projectWithMember();
    $subtask = Backend::subtask(Backend::task($project));

    $this->actingAs($user)
        ->patch(route('subtasks.update', [$project, $subtask->id]), [
            'title' => str_repeat('a', 136),
            'position' => 'last',
            'completed' => 'yes',
        ])
        ->assertSessionHasErrors(['title', 'position', 'completed']);
});

it('deletes subtasks and tolerates missing ids', function () {
    [$user, $project] = Backend::projectWithMember();
    $subtask = Backend::subtask(Backend::task($project));

    $this->actingAs($user)
        ->delete(route('subtasks.destroy', [$project, $subtask->id]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('subtasks', ['id' => $subtask->id]);

    $this->actingAs($user)
        ->delete(route('subtasks.destroy', [$project, 'missing-subtask']))
        ->assertSessionHasNoErrors();
});

it('rejects subtask mutations for subtasks from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignSubtask = Backend::subtask(Backend::task(Project::factory()->create()), [
        'title' => 'Foreign',
    ]);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('subtasks.update', [$project, $foreignSubtask->id]), ['title' => 'Stolen'])
        ->assertNotFound();

    expect($foreignSubtask->fresh()->title)->toBe('Foreign');
});

it('rejects deleting subtasks from another project by raw id', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignSubtask = Backend::subtask(Backend::task(Project::factory()->create()));

    $this->actingAs($user)
        ->delete(route('subtasks.destroy', [$project, $foreignSubtask->id]))
        ->assertNotFound();

    expect($foreignSubtask->fresh())->not->toBeNull();
});

it('attaches and detaches project members from tasks', function () {
    [$user, $project] = Backend::projectWithMember();
    $assignee = Backend::projectMember($project);
    $task = Backend::task($project);
    Event::fake();

    $this->actingAs($user)
        ->post(route('tasks.users.attach', [$project, $task]), ['user_id' => $assignee->id])
        ->assertSessionHasNoErrors();

    expect($task->users()->whereKey($assignee->id)->exists())->toBeTrue();
    Event::assertDispatched(
        TaskAssignedUser::class,
        fn (TaskAssignedUser $event) => $event->assigned === true && $event->user['id'] === $assignee->id
    );

    $this->actingAs($user)
        ->delete(route('tasks.users.detach', [$project, $task, $assignee]))
        ->assertSessionHasNoErrors();

    expect($task->users()->whereKey($assignee->id)->exists())->toBeFalse();
    Event::assertDispatched(TaskAssignedUser::class, fn (TaskAssignedUser $event) => $event->assigned === false);
});

it('rejects duplicate and non-member task assignees', function () {
    [$user, $project] = Backend::projectWithMember();
    $assignee = Backend::projectMember($project);
    $outsider = User::factory()->create();
    $task = Backend::task($project);
    $task->users()->attach($assignee);
    Event::fake();

    $this->actingAs($user)
        ->post(route('tasks.users.attach', [$project, $task]), ['user_id' => $assignee->id])
        ->assertStatus(400);

    $this->actingAs($user)
        ->post(route('tasks.users.attach', [$project, $task]), ['user_id' => $outsider->id])
        ->assertSessionHasErrors('user_id');
});

it('attaches and detaches project members from subtasks', function () {
    [$user, $project] = Backend::projectWithMember();
    $assignee = Backend::projectMember($project);
    $subtask = Backend::subtask(Backend::task($project));
    Event::fake();

    $this->actingAs($user)
        ->post(route('subtasks.users.attach', [$project, $subtask]), ['user_id' => $assignee->id])
        ->assertSessionHasNoErrors();

    expect($subtask->users()->whereKey($assignee->id)->exists())->toBeTrue();
    Event::assertDispatched(
        SubtaskAssignedUser::class,
        fn (SubtaskAssignedUser $event) => $event->assigned === true && $event->task_id === $subtask->task_id
    );

    $this->actingAs($user)
        ->delete(route('subtasks.users.detach', [$project, $subtask, $assignee]))
        ->assertSessionHasNoErrors();

    expect($subtask->users()->whereKey($assignee->id)->exists())->toBeFalse();
    Event::assertDispatched(SubtaskAssignedUser::class, fn (SubtaskAssignedUser $event) => $event->assigned === false);
});

it('rejects duplicate and non-member subtask assignees', function () {
    [$user, $project] = Backend::projectWithMember();
    $assignee = Backend::projectMember($project);
    $outsider = User::factory()->create();
    $subtask = Backend::subtask(Backend::task($project));
    $subtask->users()->attach($assignee);
    Event::fake();

    $this->actingAs($user)
        ->post(route('subtasks.users.attach', [$project, $subtask]), ['user_id' => $assignee->id])
        ->assertStatus(400);

    $this->actingAs($user)
        ->post(route('subtasks.users.attach', [$project, $subtask]), ['user_id' => $outsider->id])
        ->assertSessionHasErrors('user_id');
});

it('creates updates and deletes project tags', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('tags.store', $project), ['name' => 'Bug', 'color' => '#112233'])
        ->assertSessionHasNoErrors();

    $tag = $project->tags()->where('name', 'Bug')->firstOrFail();

    $this->actingAs($user)
        ->patch(route('tags.update', [$project, $tag->id]), ['name' => 'Risk', 'color' => '#445566'])
        ->assertSessionHasNoErrors();

    expect($tag->fresh())->name->toBe('Risk')->color->toBe('#445566');

    $this->actingAs($user)
        ->delete(route('tags.destroy', [$project, $tag->id]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
});

it('validates tag payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('tags.store', $project), ['name' => '', 'color' => 'red'])
        ->assertSessionHasErrors(['name', 'color']);
});

it('applies and detaches tags without creating duplicates', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $tag = Backend::tag($project);
    $payload = ['task_id' => $task->id, 'tag_id' => (string) $tag->id];

    $this->actingAs($user)
        ->post(route('tags.apply-tag', $project), $payload)
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('tags.apply-tag', $project), $payload)
        ->assertSessionHasNoErrors();

    expect($task->tags()->whereKey($tag->id)->count())->toBe(1);

    $this->actingAs($user)
        ->post(route('tags.detach-tag', $project), $payload)
        ->assertSessionHasNoErrors();

    expect($task->tags()->whereKey($tag->id)->exists())->toBeFalse();
});

it('rejects tags or tasks from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $foreignTag = Backend::tag(Project::factory()->create());

    $payload = ['task_id' => $task->id, 'tag_id' => (string) $foreignTag->id];

    $this->actingAs($user)
        ->post(route('tags.apply-tag', $project), $payload)
        ->assertNotFound();

    expect($task->tags()->whereKey($foreignTag->id)->exists())->toBeFalse();
});
