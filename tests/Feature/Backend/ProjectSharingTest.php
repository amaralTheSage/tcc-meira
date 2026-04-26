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

it('returns public posts from friends as a separate feed subset', function () {
    $viewer = User::factory()->create();
    $friend = User::factory()->create();
    $viewer->friends()->attach($friend);
    [$friend, $friendProject] = Backend::projectWithMember($friend, sharedProjectAttributes('friend-token'));
    [$stranger, $strangerProject] = Backend::projectWithMember(null, sharedProjectAttributes('stranger-token'));
    CommunityPost::factory()->create(['project_id' => $friendProject->id, 'title' => 'Friend Project'])->members()->attach($friend);
    CommunityPost::factory()->create(['project_id' => $strangerProject->id, 'title' => 'Stranger Project'])->members()->attach($stranger);

    $this->actingAs($viewer)
        ->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts', 2)
            ->has('friendPosts', 1)
            ->where('friendPosts.0.title', 'Friend Project'));
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
    Backend::task($project, ['id' => 'export-task', 'title' => 'Exported']);
    $project = publishSharedProjectForTest($owner, $project, ProjectVisibility::LINK_ONLY);

    $response = $this->get(route('shared.export', $project->share_token));

    $response->assertOk()
        ->assertHeader('content-disposition', 'attachment; filename="'.Str::slug($project->title).'-meira-export.json"');
    expect($response->json('schema_version'))->toBe('meira.v1');
    expect($response->json('data.tasks.0.title'))->toBe('Exported');
});

it('copies shared projects into private editable projects', function () {
    [$owner, $project] = Backend::projectWithMember();
    $firstTask = Backend::task($project, ['id' => 'copy-task-1', 'title' => 'Plan']);
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
