<?php

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('keeps new projects private by default', function () {
    $project = Project::factory()->create();

    expect($project->visibility)->toBe(ProjectVisibility::PRIVATE);
    expect($project->share_token)->toBeNull();
});

it('lets members change visibility and blocks non members', function () {
    [$owner, $project] = Backend::projectWithMember();
    $outsider = User::factory()->create();

    publishSharedProjectForTest($owner, $project, ProjectVisibility::LINK_ONLY);

    expect($project->fresh()->visibility)->toBe(ProjectVisibility::LINK_ONLY);
    expect($project->fresh()->share_token)->not->toBeNull();

    $this->actingAs($outsider)
        ->post(route('project.publish', $project), sharingPayload(ProjectVisibility::PUBLIC))
        ->assertForbidden();
});

it('shows link-only projects by share token but not on the community feed', function () {
    [$owner, $project] = Backend::projectWithMember();
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::LINK_ONLY);

    $this->get(route('shared.show', $project->share_token))->assertOk();

    $this->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('community/feed')->has('posts', 0));
});

it('shows public projects by share token and lists them on the community feed', function () {
    [$owner, $project] = Backend::projectWithMember();
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::PUBLIC);

    $this->get(route('shared.kanban', $project->share_token))->assertOk();

    $this->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('community/feed')
            ->has('posts', 1)
            ->where('posts.0.title', 'Shared Test Project'));
});

it('returns workflow preview data for public posts without uploaded images', function () {
    [$owner, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project, ['title' => 'Sprint teste', 'color' => '#0891b2']);
    $firstTask = Backend::task($project, ['id' => 'preview-task-1', 'title' => 'Research', 'sprint_id' => $sprint->id, 'x' => 10, 'y' => 20]);
    Backend::task($project, ['id' => 'preview-task-2', 'title' => 'Ship', 'x' => 320, 'y' => 140]);
    Backend::subtask($firstTask, ['completed' => true]);
    Backend::subtask($firstTask, ['completed' => false]);
    Backend::note($project, ['text' => 'Discuss launch', 'x' => 180, 'y' => 90]);
    DB::table('task_connections')->insert(['source_id' => $firstTask->id, 'target_id' => 'preview-task-2']);

    test()->actingAs($owner)
        ->post(route('project.publish', $project), array_merge(sharingPayload(ProjectVisibility::PUBLIC), ['images' => []]))
        ->assertRedirect(route('project-settings', $project));

    $this->get(route('community.feed'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.0.images', [])
            ->where('posts.0.preview.tasks.0.title', 'Research')
            ->where('posts.0.preview.tasks.0.sprint.title', 'Sprint teste')
            ->where('posts.0.preview.tasks.0.subtasks_completed', 1)
            ->where('posts.0.preview.tasks.0.subtasks_total', 2)
            ->where('posts.0.preview.tasks.0.target_ids.0', 'preview-task-2')
            ->where('posts.0.preview.notes.0.text', 'Discuss launch'));
});

it('returns not found for private project share URLs', function () {
    $project = Project::factory()->create([
        'visibility' => ProjectVisibility::PRIVATE->value,
        'share_token' => 'private-share-token',
    ]);

    $this->get(route('shared.show', $project->share_token))->assertNotFound();
});

it('revokes share tokens when projects return to private visibility', function () {
    [$owner, $project] = Backend::projectWithMember();
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::LINK_ONLY);
    $oldToken = $project->share_token;

    $this->actingAs($owner)
        ->post(route('project.publish', $project), sharingPayload(ProjectVisibility::PRIVATE))
        ->assertRedirect(route('project-settings', $project));

    expect($project->fresh()->visibility)->toBe(ProjectVisibility::PRIVATE);
    expect($project->fresh()->share_token)->toBeNull();
    $this->get(route('shared.show', $oldToken))->assertNotFound();
});

it('returns public posts from collaborators as a separate feed subset', function () {
    $viewer = User::factory()->create();
    [$viewer, $historyProject] = Backend::projectWithMember($viewer);
    $collaborator = Backend::projectMember($historyProject);
    [$collaborator, $collaboratorProject] = Backend::projectWithMember($collaborator, sharedProjectAttributes('collaborator-token'));
    [$stranger, $strangerProject] = Backend::projectWithMember(null, sharedProjectAttributes('stranger-token'));
    CommunityPost::factory()->create(['project_id' => $collaboratorProject->id, 'title' => 'Collaborator Project'])->members()->attach($collaborator);
    CommunityPost::factory()->create(['project_id' => $strangerProject->id, 'title' => 'Stranger Project'])->members()->attach($stranger);

    $this->actingAs($viewer)
        ->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts', 2)
            ->has('collaboratorPosts', 1)
            ->where('collaboratorPosts.0.title', 'Collaborator Project'));
});

it('stores publish images and returns them in community payloads', function () {
    Storage::fake('public');
    [$owner, $project] = Backend::projectWithMember();

    $this->actingAs($owner)
        ->post(route('project.publish', $project), array_merge(sharingPayload(ProjectVisibility::PUBLIC), [
            'images' => [UploadedFile::fake()->image('cover.png')],
        ]))
        ->assertRedirect(route('project-settings', $project));

    expect(CommunityPost::firstOrFail()->images()->count())->toBe(1);

    $this->get(route('community.feed'))
        ->assertInertia(fn (Assert $page) => $page->where('posts.0.images.0.url', fn (string $url): bool => str_contains($url, '/storage/community/')));
});

it('allows one character sharing descriptions', function () {
    [$owner, $project] = Backend::projectWithMember();

    $this->actingAs($owner)
        ->post(route('project.publish', $project), array_merge(sharingPayload(ProjectVisibility::PUBLIC), [
            'description' => 'A',
        ]))
        ->assertRedirect(route('project-settings', $project));

    expect(CommunityPost::firstOrFail()->description)->toBe('A');
});

it('rejects non-image publish uploads before updating sharing', function () {
    [$owner, $project] = Backend::projectWithMember();

    $this->actingAs($owner)
        ->post(route('project.publish', $project), array_merge(sharingPayload(ProjectVisibility::PUBLIC), [
            'images' => [UploadedFile::fake()->create('payload.pdf', 1, 'application/pdf')],
        ]))
        ->assertSessionHasErrors(['images.0']);

    expect($project->fresh()->visibility)->toBe(ProjectVisibility::PRIVATE);
});

it('counts one unique daily non-member view and ignores member views', function () {
    [$owner, $project] = Backend::projectWithMember();
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::PUBLIC);

    $this->get(route('shared.traceboard', $project->share_token))->assertOk();
    $this->get(route('shared.traceboard', $project->share_token))->assertOk();

    expect($project->fresh()->public_views_count)->toBe(1);

    $this->actingAs($owner)
        ->get(route('shared.traceboard', $project->share_token))
        ->assertOk();

    expect($project->fresh()->public_views_count)->toBe(1);
});

it('exports shared projects as native Meira JSON', function () {
    [$owner, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project, ['title' => 'Export Sprint', 'color' => '#16a34a']);
    Backend::task($project, ['id' => 'export-task', 'title' => 'Exported', 'sprint_id' => $sprint->id]);
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::LINK_ONLY);

    $response = $this->get(route('shared.export', $project->share_token));

    $response->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename="'.Str::slug($project->title).'-meira-export.json"');
    expect($response->json('schema_version'))->toBe('meira.v1');
    expect($response->json('data.sprints.0.title'))->toBe('Export Sprint');
    expect($response->json('data.sprints.0.color'))->toBe('#16a34a');
    expect($response->json('data.tasks.0.title'))->toBe('Exported');
    expect($response->json('data.tasks.0.sprint_id'))->toBe($sprint->id);
});

it('shares sprint metadata with read-only traceboards', function () {
    [$owner, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project, ['title' => 'Shared Sprint', 'color' => '#9333ea']);
    Backend::task($project, ['title' => 'Sprint Task', 'sprint_id' => $sprint->id]);
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::PUBLIC);

    $this->get(route('shared.traceboard', $project->share_token))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('shared-project/traceboard')
            ->has('project.sprints', 1)
            ->where('project.sprints.0.title', 'Shared Sprint')
            ->where('project.sprints.0.color', '#9333ea')
            ->where('project.tasks.0.sprint_id', $sprint->id));
});

it('copies shared projects into private editable projects', function () {
    [$owner, $project] = Backend::projectWithMember();
    $sprint = Backend::sprint($project, ['title' => 'Copy Sprint', 'color' => '#2563eb']);
    $firstTask = Backend::task($project, ['id' => 'copy-task-1', 'title' => 'Plan', 'sprint_id' => $sprint->id]);
    $secondTask = Backend::task($project, ['id' => 'copy-task-2', 'title' => 'Ship']);
    Backend::subtask($firstTask, ['title' => 'Review']);
    Backend::note($project, ['text' => 'Coordinate']);
    Backend::pin($project, ['title' => 'Runbook', 'position' => 1]);
    $project->documents()->delete();
    Backend::document($project, ['title' => 'Runbook', 'markdown' => '# Runbook']);
    DB::table('task_connections')->insert(['source_id' => $firstTask->id, 'target_id' => $secondTask->id]);
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::PUBLIC);
    $viewer = User::factory()->create();

    $this->actingAs($viewer)
        ->post(route('shared.copy', $project->share_token))
        ->assertRedirect();

    $copy = Project::where('title', $project->title.' Copy')->firstOrFail();
    expect($copy->visibility)->toBe(ProjectVisibility::PRIVATE);
    expect($copy->members()->whereKey($viewer->id)->exists())->toBeTrue();
    expect($copy->tasks()->where('title', 'Plan')->exists())->toBeTrue();
    expect($copy->sprints()->where('title', 'Copy Sprint')->exists())->toBeTrue();
    expect($copy->tasks()->where('title', 'Plan')->firstOrFail()->sprint_id)->not->toBe($sprint->id);
    expect($copy->sprints()->whereKey($copy->tasks()->where('title', 'Plan')->firstOrFail()->sprint_id)->exists())->toBeTrue();
    expect($copy->notes()->where('text', 'Coordinate')->exists())->toBeTrue();
    expect($copy->pins()->where('title', 'Runbook')->exists())->toBeTrue();
    expect($copy->documents()->where('title', 'Runbook')->exists())->toBeTrue();
    expect(copiedConnectionCount($copy))->toBe(1);
});

function publishSharedProjectForTest(User $owner, Project $project, ProjectVisibility $visibility): Project
{
    test()->actingAs($owner)
        ->post(route('project.publish', $project), sharingPayload($visibility))
        ->assertRedirect(route('project-settings', $project));
    auth()->logout();

    return $project->fresh();
}

/**
 * @return array<string, string|bool|array<int, string>>
 */
function sharingPayload(ProjectVisibility $visibility): array
{
    return [
        'title' => 'Shared Test Project',
        'description' => Backend::publishDescription(),
        'visibility' => $visibility->value,
        'create_template' => false,
        'images' => ['cover.png'],
    ];
}

function copiedConnectionCount(Project $project): int
{
    return DB::table('task_connections')
        ->whereIn('source_id', $project->tasks()->pluck('id'))
        ->count();
}

function sharedProjectAttributes(string $shareToken): array
{
    return [
        'visibility' => ProjectVisibility::PUBLIC->value,
        'share_token' => $shareToken,
        'published_at' => now(),
    ];
}
