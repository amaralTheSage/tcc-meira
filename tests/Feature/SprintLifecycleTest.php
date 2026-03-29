<?php

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function projectWithOwner(): array
{
    $user = User::factory()->create();
    $project = Project::factory()->create();
    $project->members()->attach($user);

    return [$user, $project];
}

// ──────────────────────────────────────────────
// Start Sprint
// ──────────────────────────────────────────────

it('can start a planned sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->patch(route('sprint.start', $sprint))
        ->assertRedirect();

    expect($sprint->fresh()->status)->toBe('active');
});

it('cannot start a sprint when another is already active', function () {
    [$user, $project] = projectWithOwner();

    Sprint::factory()->active()->create(['project_id' => $project->id]);

    $anotherSprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->patch(route('sprint.start', $anotherSprint))
        ->assertSessionHasErrors('sprint');

    expect($anotherSprint->fresh()->status)->toBe('planned');
});

it('guests cannot start a sprint', function () {
    $project = Project::factory()->create();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);

    $this->patch(route('sprint.start', $sprint))
        ->assertRedirect('/login');
});

// ──────────────────────────────────────────────
// Complete Sprint
// ──────────────────────────────────────────────

it('can complete an active sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->active()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->patch(route('sprint.complete', $sprint))
        ->assertRedirect();

    expect($sprint->fresh()->status)->toBe('completed');
});

it('guests cannot complete a sprint', function () {
    $project = Project::factory()->create();
    $sprint = Sprint::factory()->active()->create(['project_id' => $project->id]);

    $this->patch(route('sprint.complete', $sprint))
        ->assertRedirect('/login');
});

// ──────────────────────────────────────────────
// Task–Sprint association
// ──────────────────────────────────────────────

it('can attach tasks to a sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);
    $task = Task::factory()->create(['project_id' => $project->id, 'column_id' => null]);

    $this->actingAs($user)
        ->post(route('sprint.attach-tasks', $sprint), ['task_ids' => [(string) $task->id]])
        ->assertRedirect();

    expect($task->fresh()->sprint_id)->toBe($sprint->id);
});

it('requires task_ids when attaching tasks to a sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->post(route('sprint.attach-tasks', $sprint), [])
        ->assertSessionHasErrors('task_ids');
});

it('guests cannot attach tasks to a sprint', function () {
    $project = Project::factory()->create();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);

    $this->post(route('sprint.attach-tasks', $sprint), ['task_ids' => []])
        ->assertRedirect('/login');
});

it('cannot attach tasks from a different project to a sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->planned()->create(['project_id' => $project->id]);
    
    $otherProject = Project::factory()->create();
    $task = Task::factory()->create(['project_id' => $otherProject->id, 'column_id' => null]);

    $this->actingAs($user)
        ->post(route('sprint.attach-tasks', $sprint), ['task_ids' => [(string) $task->id]])
        ->assertSessionHasErrors('sprint');

    expect($task->fresh()->sprint_id)->toBeNull();
});

// ──────────────────────────────────────────────
// CRUD: Update & Delete
// ──────────────────────────────────────────────

it('can update a sprint', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->create(['project_id' => $project->id, 'title' => 'Old Title']);

    $this->actingAs($user)
        ->patch(route('sprint.update', [$project, $sprint]), [
            'title' => 'New Title',
            'start_at' => now()->format('Y-m-d'),
            'end_at' => now()->addDays(7)->format('Y-m-d'),
        ])
        ->assertRedirect();

    expect($sprint->fresh()->title)->toBe('New Title');
});

it('can delete a sprint and dissociate tasks', function () {
    [$user, $project] = projectWithOwner();
    $sprint = Sprint::factory()->create(['project_id' => $project->id]);
    $task = Task::factory()->create([
        'project_id' => $project->id, 
        'sprint_id' => $sprint->id,
        'column_id' => null
    ]);

    expect($task->sprint_id)->toBe($sprint->id);

    $this->actingAs($user)
        ->delete(route('sprint.destroy', [$project, $sprint]))
        ->assertRedirect();

    $this->assertDatabaseMissing('sprints', ['id' => $sprint->id]);
    expect($task->fresh()->sprint_id)->toBeNull();
});
