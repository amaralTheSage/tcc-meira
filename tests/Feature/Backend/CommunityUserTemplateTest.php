<?php

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
    [$profileUser, $project] = Backend::projectWithMember();
    $post = CommunityPost::factory()->create(['title' => 'Shared']);
    $profileUser->posts()->attach($post);
    Backend::projectTemplate($profileUser, ['name' => 'Reusable']);

    $this->actingAs(User::factory()->create())
        ->get(route('community.profile', $profileUser))
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

it('searches users by name or email', function () {
    $user = User::factory()->create();
    User::factory()->create(['name' => 'Ana Backend', 'email' => 'ana@example.test']);
    User::factory()->create(['name' => 'Other Person', 'email' => 'other@example.test']);

    $this->actingAs($user)
        ->get(route('users.search', ['search' => 'ana']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('users', 1)
            ->where('users.0.name', 'Ana Backend')
        );
});

it('accepts friendships and prevents self or duplicate friendships', function () {
    $user = User::factory()->create();
    $friend = User::factory()->create();

    $this->actingAs($user)
        ->post(route('accept_friendship', $friend))
        ->assertSessionHasNoErrors();

    expect($user->friends()->whereKey($friend->id)->count())->toBe(1);

    $this->actingAs($user)
        ->post(route('accept_friendship', $friend))
        ->assertSessionHas('message');

    $this->actingAs($user)
        ->post(route('accept_friendship', $user))
        ->assertSessionHas('message');

    expect($user->friends()->whereKey($friend->id)->count())->toBe(1);
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
