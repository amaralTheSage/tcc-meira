<?php

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use Database\Seeders\CommunityFeedSeeder;
use Database\Seeders\LegacyCommunityMockProjectSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

it('seeds legacy mock examples as real shared projects', function () {
    $this->seed([UserSeeder::class, LegacyCommunityMockProjectSeeder::class]);

    $expectedProjects = [
        'legacy-sajic-2025' => ProjectVisibility::PUBLIC,
        'legacy-sajic-2024' => ProjectVisibility::PUBLIC,
        'legacy-coisa-imoveis' => ProjectVisibility::PUBLIC,
        'legacy-meira' => ProjectVisibility::PUBLIC,
        'legacy-portfolio-academico' => ProjectVisibility::PUBLIC,
        'legacy-demo-imobiliaria' => ProjectVisibility::LINK_ONLY,
    ];

    foreach ($expectedProjects as $token => $visibility) {
        $project = Project::where('share_token', $token)
            ->with(['communityPost.images', 'documents', 'members', 'notes', 'pins', 'tasks', 'views'])
            ->firstOrFail();

        expect($project->visibility)->toBe($visibility);
        expect($project->communityPost)->not->toBeNull();
        expect($project->communityPost->images)->toHaveCount(1);
        expect($project->documents)->toHaveCount(1);
        expect($project->members->count())->toBeGreaterThan(0);
        expect($project->notes)->toHaveCount(2);
        expect($project->pins)->toHaveCount(2);
        expect($project->tasks)->toHaveCount(4);
        expect($project->views)->toHaveCount($project->public_views_count);
    }
});

it('lists public legacy examples and hides the link-only example from the board', function () {
    $this->seed([UserSeeder::class, CommunityFeedSeeder::class, LegacyCommunityMockProjectSeeder::class]);

    $this->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('community/feed')
            ->has('posts', 10)
            ->where('posts', fn (Collection $posts): bool => $posts->pluck('title')->contains('5ª SAJIC'))
            ->where('posts', fn (Collection $posts): bool => $posts->pluck('title')->contains('MEIRA'))
            ->where('posts', fn (Collection $posts): bool => ! $posts->pluck('title')->contains('Demo Imobiliária')));

    $this->get(route('shared.show', 'legacy-demo-imobiliaria'))->assertOk();
});

it('reruns the legacy seeder without duplicating project records', function () {
    $this->seed(UserSeeder::class);
    $this->seed(LegacyCommunityMockProjectSeeder::class);
    $this->seed(LegacyCommunityMockProjectSeeder::class);

    $project = Project::where('share_token', 'legacy-sajic-2025')->firstOrFail();

    expect(Project::where('share_token', 'legacy-sajic-2025')->count())->toBe(1);
    expect(CommunityPost::where('project_id', $project->id)->count())->toBe(1);
    expect($project->communityPost()->firstOrFail()->images()->count())->toBe(1);
    expect($project->tasks()->count())->toBe(4);
    expect($project->views()->count())->toBe($project->fresh()->public_views_count);
});
