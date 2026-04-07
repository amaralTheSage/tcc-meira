<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;

class NotificationFeed
{
    /**
     * Return recent notifications and unread count for one user.
     *
     * Example: app(NotificationFeed::class)->recentFor($user, 20).
     *
     * @return array{items: array<int, array<string, array<string, array<string, int|string|null>|int|string|null>|int|string|null>>, unread_count: int}
     */
    public function recentFor(User $user, int $limit = 20): array
    {
        $notifications = $user->notifications()->limit($limit)->get();

        return [
            'items' => $notifications->map(fn (DatabaseNotification $notification): array => $this->format($notification))->values()->all(),
            'unread_count' => $user->unreadNotifications()->count(),
        ];
    }

    /**
     * Convert a Laravel database notification into the frontend shape.
     *
     * Example: $this->format($notification)['read_at'].
     *
     * @return array<string, array<string, array<string, int|string|null>|int|string|null>|int|string|null>
     */
    public function format(DatabaseNotification $notification): array
    {
        return [
            ...$notification->data,
            'id' => $notification->id,
            'type' => $notification->type,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
        ];
    }
}
