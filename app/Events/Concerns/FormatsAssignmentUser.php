<?php

namespace App\Events\Concerns;

use App\Models\User;

trait FormatsAssignmentUser
{
    /**
     * @return array{id: int, name: string, email: string, avatar: ?string, email_verified_at: ?string}
     */
    private static function assignmentUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'email_verified_at' => $user->email_verified_at?->toISOString(),
        ];
    }
}
