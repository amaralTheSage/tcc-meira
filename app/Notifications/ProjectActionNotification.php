<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectActionNotification extends Notification
{
    use Queueable;

    /**
     * @param  array<string, array<string, int|string|null>|int|string|null>  $subject
     * @param  array<string, array<string, int|string|null>|int|string|null>  $context
     */
    public function __construct(
        private readonly NotificationType $projectNotificationType,
        private readonly string $message,
        private readonly string $actionUrl,
        private readonly string $actionLabel,
        private readonly User $actor,
        private readonly Project $project,
        private readonly array $subject = [],
        private readonly array $context = [],
    ) {}

    /**
     * Deliver actionable project notifications through UI, Reverb, and email.
     *
     * Example: $user->notify(new ProjectActionNotification(...)).
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    /**
     * Store the normalized notification payload.
     *
     * Example: $notification->toDatabase($user)['message'].
     *
     * @return array<string, array<string, array<string, int|string|null>|int|string|null>|int|string|null>
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->payload();
    }

    /**
     * Broadcast the same normalized payload over Reverb.
     *
     * Example: useEchoNotification(channel, callback).
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->payload());
    }

    /**
     * Send an email for the actionable notification.
     *
     * Example: Mail::fake() asserts the generated notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->mailSubject())
            ->greeting('New Meira notification')
            ->line($this->message)
            ->action($this->actionLabel, $this->actionUrl);
    }

    /**
     * Use the product notification type in database rows.
     *
     * Example: project_invite.
     */
    public function databaseType(object $notifiable): string
    {
        return $this->projectNotificationType->value;
    }

    /**
     * Use the product notification type in broadcast payloads.
     *
     * Example: task_assigned.
     */
    public function broadcastType(): string
    {
        return $this->projectNotificationType->value;
    }

    /**
     * Return a normalized array used by all delivery channels.
     *
     * Example: $notification->toDatabase($user).
     *
     * @return array<string, array<string, array<string, int|string|null>|int|string|null>|int|string|null>
     */
    public function payload(): array
    {
        return [
            'type' => $this->projectNotificationType->value,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'action_label' => $this->actionLabel,
            'actor' => $this->actorPayload(),
            'project' => $this->projectPayload(),
            'subject' => $this->subject,
            'context' => $this->context,
        ];
    }

    /**
     * Build a short subject for notification emails.
     *
     * Example: [Meira] Task assigned.
     */
    private function mailSubject(): string
    {
        return '[Meira] '.$this->actionLabel;
    }

    /**
     * Serialize the user who caused the notification.
     *
     * Example: ['id' => 1, 'name' => 'Ana'].
     *
     * @return array<string, int|string|null>
     */
    private function actorPayload(): array
    {
        return [
            'id' => $this->actor->id,
            'name' => $this->actor->name,
            'avatar' => $this->actor->avatar,
        ];
    }

    /**
     * Serialize the project related to the notification.
     *
     * Example: ['id' => 'uuid', 'title' => 'Launch'].
     *
     * @return array<string, string>
     */
    private function projectPayload(): array
    {
        return [
            'id' => $this->project->id,
            'title' => $this->project->title,
        ];
    }
}
