<?php

use App\Enums\ProjectInvitationStatus;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders the dashboard with the authenticated user project data', function () {
    [$user, $project] = Backend::projectWithMember();
    Backend::projectWithMember(User::factory()->create(), ['title' => 'Hidden']);
    Backend::projectTemplate($user, ['name' => 'Launch Template']);

    $this->actingAs($user)
        ->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('projects', 1)
            ->has('templates', 1)
            ->where('projects.0.id', $project->id)
        );
});

it('creates projects and sends pending collaborator invitations', function () {
    Notification::fake();
    $owner = User::factory()->create();
    $collaborator = User::factory()->create();

    $this->actingAs($owner)
        ->post(route('projects.store'), [
            'title' => 'Backend Coverage',
            'selectedUsers' => [$collaborator->id],
        ])
        ->assertSessionHasNoErrors();

    $project = Project::where('title', 'Backend Coverage')->firstOrFail();

    expect($project->members()->pluck('users.id')->all())->toEqualCanonicalizing([$owner->id]);
    expect(ProjectInvitation::where([
        'project_id' => $project->id,
        'invitee_id' => $collaborator->id,
        'status' => ProjectInvitationStatus::PENDING->value,
    ])->exists())->toBeTrue();
});

it('accepts and declines project invitations for invitees only', function () {
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $outsider = User::factory()->create();
    $invitation = ProjectInvitation::create([
        'project_id' => $project->id,
        'inviter_id' => $owner->id,
        'invitee_id' => $invitee->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);

    $this->actingAs($outsider)
        ->post(route('project-invitations.accept', $invitation))
        ->assertForbidden();

    $this->actingAs($invitee)
        ->post(route('project-invitations.accept', $invitation))
        ->assertRedirect(route('traceboard', $project));

    expect($project->members()->whereKey($invitee->id)->exists())->toBeTrue();
    expect($invitation->fresh()->status)->toBe(ProjectInvitationStatus::ACCEPTED);

    $decliningUser = User::factory()->create();
    $declinedInvitation = ProjectInvitation::create([
        'project_id' => $project->id,
        'inviter_id' => $owner->id,
        'invitee_id' => $decliningUser->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);

    $this->actingAs($decliningUser)
        ->post(route('project-invitations.decline', $declinedInvitation))
        ->assertRedirect();

    expect($project->members()->whereKey($decliningUser->id)->exists())->toBeFalse();
    expect($declinedInvitation->fresh()->status)->toBe(ProjectInvitationStatus::DECLINED);
});

it('validates project creation payloads', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('projects.store'), [
            'title' => str_repeat('a', 51),
            'selectedUsers' => [999],
        ])
        ->assertSessionHasErrors(['title', 'selectedUsers.0']);
});

it('renders and updates project settings', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->get(route('project-settings', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/project-settings')
            ->where('project.id', $project->id)
        );

    $this->actingAs($user)
        ->patch(route('projects.update', $project), [
            'edge_type' => 'smoothstep',
            'animated_edges' => false,
        ])
        ->assertSessionHasNoErrors();

    $updatedProject = $project->fresh();

    expect($updatedProject->edge_type)->toBe('smoothstep');
    expect((bool) $updatedProject->animated_edges)->toBeFalse();
});

it('rejects invalid project settings values', function () {
    [$user, $project] = Backend::projectWithMember(null, ['edge_type' => 'bezier']);

    $this->actingAs($user)
        ->patch(route('projects.update', $project), [
            'edge_type' => 'curly',
            'animated_edges' => 'sometimes',
        ])
        ->assertSessionHasErrors(['edge_type', 'animated_edges']);

    expect($project->fresh()->edge_type)->toBe('bezier');
});

it('publishes a project and optionally creates a template', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('project.publish', $project), [
            'title' => 'Shared Backend Project',
            'description' => Backend::publishDescription(),
            'create_template' => true,
            'images' => ['cover.png'],
        ])
        ->assertRedirect(route('project-settings', $project));

    expect(CommunityPost::where('title', 'Shared Backend Project')->exists())->toBeTrue();
    expect(ProjectTemplate::where('name', 'Template Shared Backend Project')->exists())->toBeTrue();
});

it('redirects the legacy publishing page to project settings', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->get(route('project.publishing_form', $project))
        ->assertRedirect(route('project-settings', $project));
});

it('validates publish payloads before creating community records', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('project.publish', $project), [
            'title' => '',
            'description' => 'too short',
            'images' => [],
        ])
        ->assertSessionHasErrors(['title', 'description']);

    expect(CommunityPost::count())->toBe(0);
});

it('applies a template into a new project owned by the current user', function () {
    $user = User::factory()->create();
    $template = Backend::projectTemplate($user, [
        'name' => 'BackendCoverage',
        'data' => [
            'columns' => [['name' => 'Backlog', 'position' => 0, 'type' => 'backlog']],
            'tasks' => [[
                'id' => 'template-task',
                'title' => 'Task',
                'x' => 10,
                'y' => 20,
                'position' => 0,
                'subtasks' => [],
            ]],
            'task_connections' => [],
            'notes' => [],
            'pins' => [],
        ],
    ]);

    $this->actingAs($user)
        ->post(route('project.apply_template', $template))
        ->assertRedirect();

    $project = Project::where('title', 'BackendCoverage Copy')->first();

    expect($project)->not->toBeNull();
    expect($project->members()->whereKey($user->id)->exists())->toBeTrue();
});

it('deletes a project and redirects back to the dashboard', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->delete(route('project.destroy', $project))
        ->assertRedirect(route('home'));

    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});
