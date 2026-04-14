<?php

use App\Events\ColumnAdded;
use App\Events\ColumnMoved;
use App\Events\ColumnNamed;
use App\Events\ColumnRemove;
use App\Events\CursorMoved;
use App\Events\MessageAdded;
use App\Events\MessageDeleted;
use App\Events\MessageUpdated;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Events\ProjectDocumentSaved;
use App\Events\SubtaskAdded;
use App\Events\SubtaskAssignedUser;
use App\Events\SubtaskComplete;
use App\Events\TaskAssignedUser;
use App\Events\TaskDescription;
use App\Events\TaskImageUpdated;
use App\Events\TaskMoved;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\BackendFixtures as Backend;

uses(RefreshDatabase::class);

it('exposes stable broadcast channels and payloads', function (object $event, array $channels, array $payload) {
    expect(channelNamesFor($event))->toBe($channels);
    expect($event->broadcastWith())->toMatchArray($payload);
})->with([
    'column added' => [new ColumnAdded(7, 2), ['private-columns'], ['columnId' => 7, 'position' => 2]],
    'column moved' => [new ColumnMoved(7, 4), ['private-columns'], ['columnId' => 7, 'position' => 4]],
    'column named' => [new ColumnNamed(7, 'Done'), ['private-columns'], ['columnId' => 7, 'name' => 'Done']],
    'column removed' => [new ColumnRemove(7), ['private-columns'], ['columnId' => 7]],
    'node added' => [new NodeAdded('node-1', 'Task', 1, 2), ['private-tasks'], ['nodeId' => 'node-1']],
    'node dragged' => [new NodeDragged('node-1', 'Task', 1, 2, 5), ['private-tasks'], ['userId' => 5]],
    'node removed' => [new NodeRemoved('node-1', 'Task'), ['private-tasks'], ['nodeId' => 'node-1']],
    'node renamed' => [new NodeRenamed('node-1', 'Task', 'New'), ['private-tasks'], ['text' => 'New']],
    'subtask added' => [new SubtaskAdded('sub-1', 'Subtask'), ['private-subtasks'], ['subtaskId' => 'sub-1']],
    'subtask complete' => [new SubtaskComplete('sub-1', true), ['private-subtasks'], ['completed' => true]],
    'task description' => [new TaskDescription('task-1', 'Details'), ['private-tasks'], ['text' => 'Details']],
    'task image' => [new TaskImageUpdated('task-1', 'image.png'), ['private-tasks'], ['image' => 'image.png']],
    'task moved' => [new TaskMoved('task-1', 2, 8), ['private-tasks'], ['columnId' => 8]],
    'message deleted' => [new MessageDeleted(7), ['private-private-chat'], ['messageId' => 7]],
]);

it('broadcasts cursor coordinates on the private cursor channel', function () {
    $event = new CursorMoved(10, 20, 5);

    expect(channelNamesFor($event))->toBe(['private-cursor']);
    expect($event)->x->toBe(10)->y->toBe(20)->id->toBe(5);
});

it('broadcasts chat messages with the related user loaded', function () {
    [$user, $project] = Backend::projectWithMember();
    $message = Backend::message($project, $user, ['content' => 'Hello']);
    $event = new MessageAdded($message);

    expect(channelNamesFor($event))->toBe(['private-private-chat']);
    expect($event->broadcastWith()['message']->relationLoaded('user'))->toBeTrue();
});

it('broadcasts edited chat messages with the related user loaded', function () {
    [$user, $project] = Backend::projectWithMember();
    $message = Backend::message($project, $user, ['content' => 'Edited']);
    $event = new MessageUpdated($message);

    expect(channelNamesFor($event))->toBe(['private-private-chat']);
    expect($event->broadcastWith()['message']->relationLoaded('user'))->toBeTrue();
});

it('broadcasts document saves on project document presence channels', function () {
    [$user, $project] = Backend::projectWithMember();
    $document = Backend::document($project, ['markdown' => '# Updated', 'title' => 'Runbook']);
    $event = new ProjectDocumentSaved($document, $user);

    expect(channelNamesFor($event))->toBe(["presence-project.{$project->id}.docs.{$document->id}"]);
    expect($event->broadcastWith())->toMatchArray([
        'document' => [
            'id' => $document->id,
            'title' => 'Runbook',
            'markdown' => '# Updated',
            'version' => 1,
            'updated_at' => $document->updated_at?->toISOString(),
        ],
        'editor' => [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
        ],
    ]);
});

it('broadcasts assignment users as typed payload objects', function () {
    $event = new TaskAssignedUser('project-1', 'task-1', assignmentUser(), true);
    $payload = $event->broadcastWith();

    expect(channelNamesFor($event))->toBe(['private-tasks_users']);
    expect($payload)->toMatchArray([
        'projectId' => 'project-1',
        'taskId' => 'task-1',
        'assigned' => true,
    ]);
    expect($payload['user'])->toMatchArray([
        'id' => 3,
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'avatar' => '/avatars/ada.png',
    ]);
});

it('broadcasts subtask assignment project and parent task payloads', function () {
    $event = new SubtaskAssignedUser('project-1', 'task-1', 'sub-1', assignmentUser(), false);

    expect(channelNamesFor($event))->toBe(['private-subtasks_users']);
    expect($event->broadcastWith())->toMatchArray([
        'projectId' => 'project-1',
        'taskId' => 'task-1',
        'subtaskId' => 'sub-1',
        'assigned' => false,
    ]);
});

function channelNamesFor(object $event): array
{
    $channels = $event->broadcastOn();
    $channels = is_array($channels) ? $channels : [$channels];

    return array_map(fn (object $channel) => $channel->name, $channels);
}

function assignmentUser(): User
{
    return User::factory()->make([
        'id' => 3,
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'avatar' => '/avatars/ada.png',
    ]);
}
