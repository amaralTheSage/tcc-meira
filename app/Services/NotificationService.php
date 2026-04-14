<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Message;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ProjectActionNotification;
use Illuminate\Support\Str;

class NotificationService
{
    /**
     * Notify a user about a pending project invitation.
     *
     * Example: $service->sendProjectInvite($invitation).
     */
    public function sendProjectInvite(ProjectInvitation $invitation): void
    {
        $invitation->loadMissing(['invitee', 'inviter', 'project']);
        $invitation->invitee->notify(new ProjectActionNotification(
            NotificationType::PROJECT_INVITE,
            "{$invitation->inviter->name} invited you to join {$invitation->project->title}.",
            route('home'),
            'View invitation',
            $invitation->inviter,
            $invitation->project,
            [],
            ['invitation' => ['id' => $invitation->id, 'status' => $invitation->status->value]],
        ));
    }

    /**
     * Notify an assignee that a project task was assigned to them.
     *
     * Example: $service->sendTaskAssigned($user, $actor, $project, $task).
     */
    public function sendTaskAssigned(User $assignee, User $actor, Project $project, Task $task): void
    {
        if ($assignee->is($actor)) {
            return;
        }

        $assignee->notify(new ProjectActionNotification(
            NotificationType::TASK_ASSIGNED,
            "{$actor->name} assigned {$task->title} to you in {$project->title}.",
            route('kanban', $project),
            'View task',
            $actor,
            $project,
            ['id' => $task->id, 'type' => 'task', 'title' => $task->title],
        ));
    }

    /**
     * Notify an assignee that a project subtask was assigned to them.
     *
     * Example: $service->sendSubtaskAssigned($user, $actor, $project, $task, $subtask).
     */
    public function sendSubtaskAssigned(User $assignee, User $actor, Project $project, Task $task, Subtask $subtask): void
    {
        if ($assignee->is($actor)) {
            return;
        }

        $assignee->notify(new ProjectActionNotification(
            NotificationType::SUBTASK_ASSIGNED,
            "{$actor->name} assigned {$subtask->title} to you in {$project->title}.",
            route('kanban', $project),
            'View subtask',
            $actor,
            $project,
            ['id' => $subtask->id, 'type' => 'subtask', 'title' => $subtask->title],
            ['parent_task' => ['id' => $task->id, 'title' => $task->title]],
        ));
    }

    /**
     * Notify a project member that they were mentioned in chat.
     *
     * Example: $service->sendChatMention($user, $actor, $project, $message).
     */
    public function sendChatMention(User $mentionedUser, User $actor, Project $project, Message $message): void
    {
        if ($mentionedUser->is($actor)) {
            return;
        }

        $mentionedUser->notify(new ProjectActionNotification(
            NotificationType::CHAT_MENTION,
            "{$actor->name} mentioned you in {$project->title}: ".Str::limit($message->content, 80),
            route('team-chat', $project),
            'Open chat',
            $actor,
            $project,
            ['id' => (string) $message->id, 'type' => 'message', 'title' => Str::limit($message->content, 40)],
        ));
    }
}
