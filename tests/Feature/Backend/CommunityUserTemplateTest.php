<?php

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders the community feed', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('community.feed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('community/feed'));
});

it('renders community profiles with projects posts and templates', function () {
    [$profileUser, $project] = Backend::projectWithMember(null, [
        'visibility' => ProjectVisibility::PUBLIC->value,
        'share_token' => 'profile-share-token',
        'published_at' => now(),
    ]);
    $post = CommunityPost::factory()->create(['project_id' => $project->id, 'title' => 'Shared']);
    $profileUser->posts()->attach($post);
    Backend::projectTemplate($profileUser, ['name' => 'Reusable']);

    $this->get(route('community.profile', $profileUser))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('community/profile')
            ->where('user.id', $profileUser->id)
            ->has('user.projects', 1)
            ->has('user.posts', 1)
            ->has('user.templates', 1)
            ->where('user.projects.0.id', $project->id)
        );
});

it('searches users by name or email and prioritizes collaborators', function () {
    $user = User::factory()->create(['name' => 'Ana Current']);
    [, $project] = Backend::projectWithMember($user);
    $collaborator = Backend::projectMember($project, ['name' => 'Ana Zed', 'email' => 'collaborator@example.test']);
    User::factory()->create(['name' => 'Ana Backend', 'email' => 'ana@example.test']);
    User::factory()->create(['name' => 'Other Person', 'email' => 'other@example.test']);

    $this->actingAs($user)
        ->get(route('users.search', ['search' => 'ana']))
        ->assertOk()
        ->assertJsonCount(2)
        ->assertJsonPath('0.id', $collaborator->id)
        ->assertJsonPath('0.has_collaborated', true)
        ->assertJsonPath('0.shared_projects_count', 1)
        ->assertJsonMissing(['name' => 'Ana Current']);
});

it('renders template preview pages with the template payload', function (string $path, string $component) {
    $user = User::factory()->create();
    $template = Backend::projectTemplate($user);

    $this->actingAs($user)
        ->get("/templates/{$template->id}/{$path}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component($component)
            ->where('template.id', $template->id)
        );
})->with([
    'traceboard preview' => ['traceboard', 'template-visualizing/traceboard'],
    'kanban preview' => ['kanban', 'template-visualizing/kanban'],
    'pins preview' => ['pins', 'template-visualizing/pins'],
]);
