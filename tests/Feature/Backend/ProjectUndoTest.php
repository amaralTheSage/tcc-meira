<?php

use App\Models\ProjectUndoAction;
use Illuminate\Support\Facades\DB;
use Tests\Support\BackendFixtures as Backend;

it('undoes the current users own latest task creation', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)->post(route('tasks.store', $project), [
        'id' => 'undo-created-task',
        'x' => 10,
        'y' => 20,
    ])->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => 'undo-created-task']);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseMissing('tasks', ['id' => 'undo-created-task']);
    expect(ProjectUndoAction::whereNotNull('undone_at')->count())->toBe(1);
});

it('does not undo another project members action', function () {
    [$owner, $project] = Backend::projectWithMember();
    $member = Backend::projectMember($project);

    $this->actingAs($owner)->post(route('tasks.store', $project), [
        'id' => 'owner-created-task',
        'x' => 10,
        'y' => 20,
    ]);

    $this->actingAs($member)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => 'owner-created-task']);
    expect(ProjectUndoAction::whereNull('undone_at')->count())->toBe(1);
});

it('keeps the undo action available when the task changed after recording', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['title' => 'Before']);

    $this->actingAs($user)->patch(route('tasks.update', [$project, $task]), [
        'title' => 'After',
    ])->assertRedirect();

    $task->fresh()->update(['title' => 'Concurrent edit']);

    $this->actingAs($user)->post(route('project.undo', $project))
        ->assertSessionHasErrors('projectUndo');

    $this->assertDatabaseHas('tasks', ['id' => $task->id, 'title' => 'Concurrent edit']);
    expect(ProjectUndoAction::whereNull('undone_at')->count())->toBe(1);
});

it('restores a deleted task with board relations', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['id' => 'deleted-task']);
    $target = Backend::task($project, ['id' => 'target-task']);
    $tag = Backend::tag($project);
    $assignee = Backend::projectMember($project);
    $subtask = Backend::subtask($task, ['title' => 'Nested work']);

    $task->tags()->attach((string) $tag->id);
    $task->users()->attach($assignee->id);
    $subtask->users()->attach($assignee->id);
    DB::table('task_connections')->insert(['source_id' => $task->id, 'target_id' => $target->id]);

    $this->actingAs($user)->delete(route('tasks.destroy', [$project, $task->id]))->assertRedirect();
    $this->assertDatabaseMissing('tasks', ['id' => $task->id]);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $task->id]);
    $this->assertDatabaseHas('subtasks', ['id' => $subtask->id, 'task_id' => $task->id]);
    $this->assertDatabaseHas('tag_task', ['task_id' => $task->id, 'tag_id' => $tag->id]);
    $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $assignee->id]);
    $this->assertDatabaseHas('subtask_user', ['subtask_id' => $subtask->id, 'user_id' => $assignee->id]);
    $this->assertDatabaseHas('task_connections', ['source_id' => $task->id, 'target_id' => $target->id]);
});

it('undoes kanban task reorder as one action', function () {
    [$user, $project] = Backend::projectWithMember();
    $first = Backend::task($project, ['position' => 1]);
    $second = Backend::task($project, ['position' => 2]);

    $this->actingAs($user)->patch(route('tasks.reorder', $project), [
        'tasks' => [
            ['id' => $first->id, 'position' => 2],
            ['id' => $second->id, 'position' => 1],
        ],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $first->id, 'position' => 1]);
    $this->assertDatabaseHas('tasks', ['id' => $second->id, 'position' => 2]);
    expect(ProjectUndoAction::count())->toBe(1);
});

it('undoes only the final traceboard drag move', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['x' => 5, 'y' => 8]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => false,
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(0);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 100,
        'y' => 120,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $task->id, 'x' => 5, 'y' => 8]);
    expect(ProjectUndoAction::count())->toBe(1);
});

it('undoes placeholder traceboard task moves with database defaults', function () {
    [$user, $project] = Backend::projectWithMember();
    $taskId = 'placeholder-moved-task';

    $this->actingAs($user)->patch(route('tasks.move', [$project, $taskId]), [
        'x' => 40,
        'y' => 50,
        '_undoable' => true,
        '_undo_before' => ['x' => 10, 'y' => 15],
    ])->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $taskId, 'status' => 'pending']);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', [
        'id' => $taskId,
        'status' => 'pending',
        'x' => 10,
        'y' => 15,
    ]);
});

it('collapses repeated traceboard task moves into one undo action', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['x' => 5, 'y' => 8]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 100,
        'y' => 120,
        '_undoable' => true,
        '_undo_before' => ['x' => 50, 'y' => 60],
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(1);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $task->id, 'x' => 5, 'y' => 8]);
});

it('collapses repeated traceboard note moves into one undo action', function () {
    [$user, $project] = Backend::projectWithMember();
    $note = Backend::note($project, ['x' => 10, 'y' => 15]);

    $this->actingAs($user)->patch(route('notes.move', [$project, $note]), [
        'x' => 40,
        'y' => 50,
        '_undoable' => true,
        '_undo_before' => ['x' => 10, 'y' => 15],
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('notes.move', [$project, $note]), [
        'x' => 70,
        'y' => 80,
        '_undoable' => true,
        '_undo_before' => ['x' => 40, 'y' => 50],
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(1);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('notes', ['id' => $note->id, 'x' => 10, 'y' => 15]);
});

it('keeps separate traceboard move undo actions for different tasks', function () {
    [$user, $project] = Backend::projectWithMember();
    $first = Backend::task($project, ['x' => 5, 'y' => 8]);
    $second = Backend::task($project, ['x' => 30, 'y' => 40]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $first]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('tasks.move', [$project, $second]), [
        'x' => 70,
        'y' => 80,
        '_undoable' => true,
        '_undo_before' => ['x' => 30, 'y' => 40],
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(2);
});

it('does not collapse traceboard moves across another undoable action', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['title' => 'Before title', 'x' => 5, 'y' => 8]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('tasks.update', [$project, $task]), [
        'title' => 'Middle title',
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 100,
        'y' => 120,
        '_undoable' => true,
        '_undo_before' => ['x' => 50, 'y' => 60],
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(3);
});

it('deletes a collapsed traceboard move when the task returns to its original position', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['x' => 5, 'y' => 8]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 5,
        'y' => 8,
        '_undoable' => true,
        '_undo_before' => ['x' => 50, 'y' => 60],
    ])->assertRedirect();

    expect(ProjectUndoAction::count())->toBe(0);
});

it('preserves later non-position task state when undoing a collapsed move', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['title' => 'Original title', 'x' => 5, 'y' => 8]);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 50,
        'y' => 60,
        '_undoable' => true,
        '_undo_before' => ['x' => 5, 'y' => 8],
    ])->assertRedirect();

    $task->fresh()->update(['title' => 'External title']);

    $this->actingAs($user)->patch(route('tasks.move', [$project, $task]), [
        'x' => 100,
        'y' => 120,
        '_undoable' => true,
        '_undo_before' => ['x' => 50, 'y' => 60],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();

    $this->assertDatabaseHas('tasks', [
        'id' => $task->id,
        'title' => 'External title',
        'x' => 5,
        'y' => 8,
    ]);
});

it('undoes pin reorders and tag application', function () {
    [$user, $project] = Backend::projectWithMember();
    $first = Backend::pin($project, ['position' => 1]);
    $second = Backend::pin($project, ['position' => 2]);
    $task = Backend::task($project);
    $tag = Backend::tag($project);

    $this->actingAs($user)->patch(route('pins.reorder', $project), [
        'pins' => [
            ['id' => $first->id, 'position' => 2],
            ['id' => $second->id, 'position' => 1],
        ],
    ])->assertRedirect();

    $this->actingAs($user)->post(route('tags.apply-tag', $project), [
        'task_id' => $task->id,
        'tag_id' => $tag->id,
    ])->assertRedirect();

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();
    $this->assertDatabaseMissing('tag_task', ['task_id' => $task->id, 'tag_id' => $tag->id]);

    $this->actingAs($user)->post(route('project.undo', $project))->assertRedirect();
    $this->assertDatabaseHas('pins', ['id' => $first->id, 'position' => 1]);
    $this->assertDatabaseHas('pins', ['id' => $second->id, 'position' => 2]);
});
