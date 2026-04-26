<?php

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\User;
use App\Notifications\ProjectInvite;

// Send notifications to users
class NotificationService
{
    /**
     * Send one typed notification to one user.
     *
     * Example: $service->toOne($user, NotificationType::PROJECT_INVITE, $payload);
     *
     * @param  array<string, string>  $data
     */
    public function toOne(User $user, NotificationType $type, array $data = []): void
    {
        $data['userId'] = (string) $user->id;
        $data['type'] = $type->value;

        switch ($type) {
            case NotificationType::PROJECT_INVITE:
                $user->notify(new ProjectInvite($data));
                break;
        }
    }

    // public function toMultiple(Collection $users, string $message, string $route, NotificationType $type): void
    // {
    //     Notification::send($users, new ProjectInvite(['message' => $message, 'route' => $route]));
    // }
}
