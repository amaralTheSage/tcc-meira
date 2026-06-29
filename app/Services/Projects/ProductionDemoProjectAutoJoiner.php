<?php

namespace App\Services\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Foundation\Application;

class ProductionDemoProjectAutoJoiner
{
    private const DEMO_PROJECT_TITLE = 'Meira Demo Project';

    private Application $app;

    private Project $projects;

    /**
     * Build the production demo project auto-join workflow.
     *
     * Example: app(ProductionDemoProjectAutoJoiner::class).
     */
    public function __construct(Application $app, Project $projects)
    {
        $this->app = $app;
        $this->projects = $projects;
    }

    /**
     * Attach a newly created user to the production demo project when present.
     *
     * Example: $autoJoiner->attachNewUser($user).
     */
    public function attachNewUser(User $user): void
    {
        if (! $this->app->environment('production')) {
            return;
        }

        $project = $this->projects->newQuery()
            ->where('title', self::DEMO_PROJECT_TITLE)
            ->latest()
            ->first();

        $project?->members()->syncWithoutDetaching([$user->id]);
    }
}
