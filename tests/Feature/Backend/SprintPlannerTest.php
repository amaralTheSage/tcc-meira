<?php

use App\Models\Project;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders sprint planning with project sprints and tasks', function () {
    [$user, $project] = Backend::projectWithMember();
    Backend::sprint($project, ['title' => 'Sprint One']);
    Backend::task($project, ['title' => 'Task One']);

    $this->actingAs($user)
        ->get(route('sprint.index', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/sprint-planning')
            ->where('project.id', $project->id)
            ->has('project.sprints', 1)
            ->has('tasks', 1)
        );
});

it('creates project sprints', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('sprint.store', $project), [
            'title' => 'Sprint Two',
            'start_at' => '2026-05-01',
            'end_at' => '2026-05-10',
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('sprints', [
        'project_id' => $project->id,
        'title' => 'Sprint Two',
    ]);
});

it('validates sprint creation and update dates', function () {
    [$user, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project);

    $this->actingAs($user)
        ->post(route('sprint.store', $project), [
            'title' => '',
            'start_at' => '2026-05-10',
            'end_at' => '2026-05-01',
        ])
        ->assertSessionHasErrors(['title', 'end_at']);

    $this->actingAs($user)
        ->patch(route('sprint.update', [$project, $sprint]), [
            'title' => '',
            'start_at' => 'not-a-date',
            'end_at' => '2026-05-01',
        ])
        ->assertSessionHasErrors(['title', 'start_at']);
});

it('requires at least one task when attaching tasks to a sprint', function () {
    [$user, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project);

    $this->actingAs($user)
        ->post(route('sprint.attach-tasks', $sprint), ['task_ids' => []])
        ->assertSessionHasErrors('task_ids');
});

it('forbids outsiders from global sprint lifecycle routes', function () {
    [$user, $project] = Backend::projectWithMember();
    $outsider = User::factory()->create();
    $sprint = Backend::sprint($project);
    $task = Backend::task($project);

    $this->actingAs($outsider)
        ->post(route('sprint.attach-tasks', $sprint), ['task_ids' => [$task->id]])
        ->assertForbidden();

    $this->actingAs($outsider)
        ->patch(route('sprint.start', $sprint))
        ->assertForbidden();

    $this->actingAs($outsider)
        ->patch(route('sprint.complete', $sprint))
        ->assertForbidden();

    expect($user->projects()->whereKey($project->id)->exists())->toBeTrue();
});

it('rejects sprint mutations for sprints from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignProject = Project::factory()->create();
    $foreignSprint = Backend::sprint($foreignProject, ['title' => 'Foreign']);

    $this->actingAs($user)
        ->patch(route('sprint.update', [$project, $foreignSprint]), [
            'title' => 'Stolen',
            'start_at' => '2026-05-01',
            'end_at' => '2026-05-10',
        ])
        ->assertNotFound();

    expect($foreignSprint->fresh()->title)->toBe('Foreign');
});
