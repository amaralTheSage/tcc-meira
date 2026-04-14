<?php

use App\Models\Project;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders project pins in board order', function () {
    [$user, $project] = Backend::projectWithMember();
    Backend::pin($project, ['text' => 'Second', 'position' => 2]);
    Backend::pin($project, ['text' => 'First', 'position' => 1]);

    $this->actingAs($user)
        ->get(route('pins', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/pins')
            ->where('pins.0.text', 'First')
            ->where('pins.1.text', 'Second')
        );
});

it('creates text and link pins', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('pins.store', $project), [
            'type' => 'text',
            'text' => 'Remember release notes',
            'position' => 1,
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('pins.store', $project), [
            'type' => 'link',
            'title' => 'Spec',
            'url' => 'https://example.test/spec',
            'position' => 2,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('pins', ['project_id' => $project->id, 'text' => 'Remember release notes']);
    $this->assertDatabaseHas('pins', ['project_id' => $project->id, 'title' => 'Spec']);
});

it('validates pin creation payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('pins.store', $project), [
            'type' => 'image',
            'text' => str_repeat('a', 2801),
            'title' => str_repeat('b', 141),
            'url' => str_repeat('c', 4001),
        ])
        ->assertSessionHasErrors(['type', 'text', 'title', 'url', 'position']);
});

it('moves and deletes pins', function () {
    [$user, $project] = Backend::projectWithMember();
    $pin = Backend::pin($project, ['position' => 1]);

    $this->actingAs($user)
        ->patch(route('pins.move', [$project, $pin]), ['position' => 9])
        ->assertSessionHasNoErrors();

    expect($pin->fresh()->position)->toBe(9);

    $this->actingAs($user)
        ->delete(route('pins.destroy', [$project, $pin]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('pins', ['id' => $pin->id]);
});

it('validates pin movement payloads', function () {
    [$user, $project] = Backend::projectWithMember();
    $pin = Backend::pin($project);

    $this->actingAs($user)
        ->patch(route('pins.move', [$project, $pin]), ['position' => 'top'])
        ->assertSessionHasErrors('position');
});

it('rejects pin mutations for pins from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignPin = Backend::pin(Project::factory()->create(), ['position' => 1]);

    $this->actingAs($user)
        ->patch(route('pins.move', [$project, $foreignPin]), ['position' => 8])
        ->assertNotFound();

    expect($foreignPin->fresh()->position)->toBe(1);
});
