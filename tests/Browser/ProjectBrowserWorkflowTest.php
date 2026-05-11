<?php

use App\Models\Column;
use App\Models\Message;
use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Tests\Support\BackendFixtures as Backend;

it('creates a project from the authenticated home page', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    visit('/home')
        ->click('@home-new-project-trigger')
        ->fill('@project-title-input', 'Browser Created Project')
        ->click('@project-create-submit')
        ->wait(0.5)
        ->assertPathContains('/traceboard');

    expect(Project::where('title', 'Browser Created Project')->exists())->toBeTrue();
});

it('navigates between project workspaces from the sidebar', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Navigation']);

    $this->actingAs($user);

    $page = visit("/{$project->id}/traceboard")
        ->assertPresent('@traceboard-board');

    $page->click('@nav-kanban')->assertPathContains('/kanban')->assertSee('Browser Navigation');
    $page->click('@nav-sprint')->assertPathContains('/sprint')->assertSee('New sprint');
    $page->click('@nav-pins')->assertPathContains('/pins')->assertSee('Pins');
    $page->click('@nav-chat')->assertPathContains('/team-chat')->assertPresent('@team-chat-input');
    $page->click('@nav-docs')->assertPathContains('/docs');
    $page->click('@nav-project-settings')->assertPathContains('/project-settings')->assertSee('Project Settings');
});

it('switches projects from the sidebar while preserving the current workspace', function () {
    [$user, $sourceProject] = Backend::projectWithMember(null, ['title' => 'Source Project']);
    [, $targetProject] = Backend::projectWithMember($user, ['title' => 'Target Project']);

    $this->actingAs($user);

    visit("/{$sourceProject->id}/kanban")
        ->click('@project-switcher-trigger')
        ->click("@project-switcher-option-{$targetProject->id}")
        ->assertPathContains("/{$targetProject->id}/kanban")
        ->assertSee('Target Project');
});

it('creates and edits Kanban columns, tasks, and subtasks', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Kanban']);

    $this->actingAs($user);

    $page = visit("/{$project->id}/kanban")
        ->click('@kanban-add-column')
        ->wait(0.5);

    $column = Column::where('project_id', $project->id)->where('type', 'standard')->firstOrFail();
    $column->update(['position' => -1]);

    $page = visit("/{$project->id}/kanban")
        ->assertPresent("@kanban-column-title-{$column->id}")
        ->click("@kanban-column-title-{$column->id}");

    $columnNameInput = "input[data-testid=\"kanban-column-name-input-{$column->id}\"]";

    $page->fill($columnNameInput, 'Browser Column')
        ->keys($columnNameInput, 'Enter')
        ->click("@kanban-add-task-{$column->id}")
        ->fill("@kanban-new-task-input-{$column->id}", 'Browser Kanban Task')
        ->keys("@kanban-new-task-input-{$column->id}", 'Enter')
        ->wait(0.5)
        ->assertSee('Browser Kanban Task');

    $task = Task::where('project_id', $project->id)->where('title', 'Browser Kanban Task')->firstOrFail();

    $page->click("@kanban-task-{$task->id}")
        ->assertPresent("@kanban-task-modal-{$task->id}")
        ->click('@kanban-add-subtask')
        ->fill('@kanban-new-subtask-input', 'Browser Subtask')
        ->keys('@kanban-new-subtask-input', 'Enter')
        ->wait(0.5);

    expect($column->fresh()->name)->toBe('Browser Column');
    expect(Subtask::where('title', 'Browser Subtask')->exists())->toBeTrue();
});

it('creates traceboard nodes and exposes tasks on Kanban', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Traceboard']);

    $this->actingAs($user);

    visit("/{$project->id}/traceboard")
        ->click('@traceboard-add-task')
        ->click('@traceboard-add-note')
        ->wait(0.7)
        ->click('@nav-kanban')
        ->assertPathContains('/kanban')
        ->assertSee('Untitled Task');

    expect(Task::where('project_id', $project->id)->exists())->toBeTrue();
    expect(Note::where('project_id', $project->id)->exists())->toBeTrue();
});

it('creates a sprint, attaches a task, starts it, and completes it', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Sprint Project']);
    $task = Backend::task($project, ['title' => 'Sprint Browser Task']);

    $this->actingAs($user);

    $page = visit("/{$project->id}/sprint")
        ->click('@sprint-new-trigger')
        ->fill('@sprint-title-input', 'Browser Sprint')
        ->click('@sprint-submit')
        ->wait(0.5)
        ->assertSee('Select tasks')
        ->click("@sprint-task-option-{$task->id}")
        ->click('@sprint-attach-tasks')
        ->wait(0.5);

    $sprint = Sprint::where('title', 'Browser Sprint')->firstOrFail();

    $page->click("@sprint-start-{$sprint->id}")
        ->wait(0.5)
        ->click("@sprint-complete-{$sprint->id}")
        ->wait(0.5);

    expect($task->fresh()->sprint_id)->toBe($sprint->id);
    expect($sprint->fresh()->status)->toBe('completed');
});

it('creates text and link pins', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Pins']);

    $this->actingAs($user);

    visit("/{$project->id}/pins")
        ->click('@pin-add-text-trigger')
        ->fill('@pin-text-input', 'Remember the launch checklist')
        ->click('@pin-submit')
        ->wait(0.5)
        ->assertSee('Remember the launch checklist')
        ->click('@pin-add-link-trigger')
        ->fill('@pin-title-input', 'Project Docs')
        ->fill('@pin-url-input', 'https://example.com/docs')
        ->click('@pin-submit')
        ->wait(0.5)
        ->assertSee('Project Docs');

    expect(Pin::where('project_id', $project->id)->count())->toBe(2);
});

it('sends a team chat message', function () {
    [$user, $project] = Backend::projectWithMember(null, ['title' => 'Browser Chat']);

    $this->actingAs($user);

    visit("/{$project->id}/team-chat")
        ->fill('@team-chat-input', 'Browser chat message')
        ->click('@team-chat-send')
        ->wait(0.5)
        ->assertSee('Browser chat message');

    expect(Message::where('content', 'Browser chat message')->exists())->toBeTrue();
});
