<?php

use App\Enums\NotificationType;
use App\Notifications\ProjectActionNotification;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\Support\BackendFixtures as Backend;

uses(RefreshDatabase::class);

it('sends task and subtask assignment notifications', function () {
    Notification::fake();
    [$actor, $project] = Backend::projectWithMember();
    $assignee = Backend::projectMember($project);
    $task = Backend::task($project, ['title' => 'Ship']);
    $subtask = Backend::subtask($task, ['title' => 'Review']);

    app(NotificationService::class)->sendTaskAssigned($assignee, $actor, $project, $task);
    app(NotificationService::class)->sendSubtaskAssigned($assignee, $actor, $project, $task, $subtask);

    Notification::assertSentTo($assignee, ProjectActionNotification::class, typeWasSent(NotificationType::TASK_ASSIGNED));
    Notification::assertSentTo($assignee, ProjectActionNotification::class, typeWasSent(NotificationType::SUBTASK_ASSIGNED));
});

it('skips assignment notifications when users assign themselves', function () {
    Notification::fake();
    [$actor, $project] = Backend::projectWithMember();
    $task = Backend::task($project, ['title' => 'Ship']);

    app(NotificationService::class)->sendTaskAssigned($actor, $actor, $project, $task);

    Notification::assertNothingSent();
});

function typeWasSent(NotificationType $type): Closure
{
    return fn (ProjectActionNotification $notification): bool => $notification->payload()['type'] === $type->value;
}
