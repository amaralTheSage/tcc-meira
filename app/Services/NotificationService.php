<?php

use App\Enums\NotificationType;
use App\Models\User;
use App\Notifications\ProjectInvite;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Notification;

// Send notifications to users
class NotificationService
{
    public function toOne(User $user, NotificationType $type, array $data = []): void
    {
        $data['userId'] = $user->id;
        $data['type'] = $user->type;

        switch ($type) {
            case 'project_invite':
                $user->notify(new ProjectInvite($data));
                break;
        }
    }

    // public function toMultiple(Collection $users, string $message, string $route, NotificationType $type): void
    // {
    //     Notification::send($users, new ProjectInvite(['message' => $message, 'route' => $route]));
    // }
}
