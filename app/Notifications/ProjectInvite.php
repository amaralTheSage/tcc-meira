<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectInvite extends Notification
{
    use Queueable;

    private string $userId;

    private string $projectName;

    private string $confirmationUrl;

    private string $type;

    /**
     * Create a new notification instance.
     */
    public function __construct(array $data)
    {
        $this->userId = $data['userId'];
        $this->projectName = $data['projectName'];
        $this->confirmationUrl = $data['confirmationUrl'];
        $this->type = $data['type'];
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new mailmessage)
            ->greeting('you received an invite!')
            ->line("you have been invited to the project {$this->projectName}")
            ->action('press here to accept', url($this->confirmationUrl));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'userId' => $this->userId,
            'projectName' => $this->projectName,
            'confirmationUrl' => $this->confirmationUrl,
            'type' => $this->type,
        ];
    }
}
