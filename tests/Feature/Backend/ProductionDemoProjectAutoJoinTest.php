<?php

use App\Models\Project;
use App\Models\User;

it('attaches new production users to the existing demo project', function () {
    setAppEnvironment('production');
    $project = Project::factory()->create(['title' => 'Meira Demo Project']);

    $user = User::factory()->create();

    expect($project->members()->whereKey($user->id)->exists())->toBeTrue();
});

it('does not attach new users outside production', function () {
    setAppEnvironment('testing');
    $project = Project::factory()->create(['title' => 'Meira Demo Project']);

    $user = User::factory()->create();

    expect($project->members()->whereKey($user->id)->exists())->toBeFalse();
});

it('creates production users when the demo project is missing', function () {
    setAppEnvironment('production');

    $user = User::factory()->create();

    expect($user->exists)->toBeTrue();
    expect($user->projects()->count())->toBe(0);
});

it('does not backfill users created before the demo project exists', function () {
    setAppEnvironment('production');
    $user = User::factory()->create();

    $project = Project::factory()->create(['title' => 'Meira Demo Project']);

    expect($project->members()->whereKey($user->id)->exists())->toBeFalse();
});

function setAppEnvironment(string $environment): void
{
    app()->detectEnvironment(fn (): string => $environment);
}
