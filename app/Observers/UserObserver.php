<?php

namespace App\Observers;

use App\Models\User;
use App\Services\Projects\ProductionDemoProjectAutoJoiner;

class UserObserver
{
    private ProductionDemoProjectAutoJoiner $autoJoiner;

    /**
     * Build the observer with the demo project auto-join workflow.
     *
     * Example: app(UserObserver::class).
     */
    public function __construct(ProductionDemoProjectAutoJoiner $autoJoiner)
    {
        $this->autoJoiner = $autoJoiner;
    }

    /**
     * Keep production demo access automatic for users created by AuthKit.
     *
     * Example: User::factory()->create() triggers the observer.
     */
    public function created(User $user): void
    {
        $this->autoJoiner
            ->attachNewUser($user);
    }
}
