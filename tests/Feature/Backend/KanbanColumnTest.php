<?php

use App\Enums\ColumnType;
use App\Events\ColumnAdded;
use App\Events\ColumnMoved;
use App\Events\ColumnNamed;
use App\Events\ColumnRemove;
use App\Models\Project;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders project columns in board order with related tasks', function () {
    [$user, $project] = Backend::projectWithMember();
    Backend::task($project, ['title' => 'Visible task']);

    $this->actingAs($user)
        ->get(route('kanban', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/kanban')
            ->where('project.id', $project->id)
            ->has('columns', 4)
            ->where('columns.0.type', ColumnType::BACKLOG->value)
        );
});

it('creates kanban columns and broadcasts them', function () {
    [$user, $project] = Backend::projectWithMember();
    Event::fake();

    $this->actingAs($user)
        ->post(route('column.store', $project), ['position' => 8])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('columns', [
        'project_id' => $project->id,
        'position' => 8,
    ]);
    Event::assertDispatched(ColumnAdded::class);
});

it('validates column creation payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('column.store', $project), ['position' => 'last'])
        ->assertSessionHasErrors('position');
});

it('updates kanban column labels and positions', function () {
    [$user, $project] = Backend::projectWithMember();
    $column = Backend::defaultColumn($project, ColumnType::TODO);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('column.update', [$project, $column]), [
            'name' => 'Ready',
            'position' => 12,
        ])
        ->assertSessionHasNoErrors();

    expect($column->fresh())->name->toBe('Ready')->position->toBe(12);
    Event::assertDispatched(ColumnNamed::class);
});

it('validates column update payloads', function () {
    [$user, $project] = Backend::projectWithMember();
    $column = Backend::defaultColumn($project, ColumnType::TODO);

    $this->actingAs($user)
        ->patch(route('column.update', [$project, $column]), [
            'name' => str_repeat('a', 51),
            'position' => 'first',
        ])
        ->assertSessionHasErrors(['name', 'position']);
});

it('reorders project columns', function () {
    [$user, $project] = Backend::projectWithMember();
    $todo = Backend::defaultColumn($project, ColumnType::TODO);
    $done = Backend::defaultColumn($project, ColumnType::DONE);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('column.reorder', $project), [
            'columns' => [
                ['id' => $todo->id, 'position' => 4],
                ['id' => $done->id, 'position' => 1],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect($todo->fresh()->position)->toBe(4);
    expect($done->fresh()->position)->toBe(1);
    Event::assertDispatched(ColumnMoved::class);
});

it('validates column reorder payloads', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->patch(route('column.reorder', $project), [
            'columns' => [['id' => 'missing', 'position' => 'first']],
        ])
        ->assertSessionHasErrors(['columns.0.id', 'columns.0.position']);
});

it('deletes kanban columns and broadcasts removal', function () {
    [$user, $project] = Backend::projectWithMember();
    $column = Backend::defaultColumn($project, ColumnType::TODO);
    Event::fake();

    $this->actingAs($user)
        ->delete(route('column.destroy', [$project, $column]))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('columns', ['id' => $column->id]);
    Event::assertDispatched(ColumnRemove::class);
});

it('rejects column mutations for columns from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignProject = Project::factory()->create();
    $foreignColumn = Backend::defaultColumn($foreignProject, ColumnType::TODO);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('column.update', [$project, $foreignColumn]), ['name' => 'Stolen'])
        ->assertNotFound();

    expect($foreignColumn->fresh()->name)->not->toBe('Stolen');
});

it('rejects reorder payloads that include columns from another project', function () {
    [$user, $project] = Backend::projectWithMember();
    $foreignProject = Project::factory()->create();
    $foreignColumn = Backend::defaultColumn($foreignProject, ColumnType::TODO);
    Event::fake();

    $this->actingAs($user)
        ->patch(route('column.reorder', $project), [
            'columns' => [['id' => $foreignColumn->id, 'position' => 99]],
        ])
        ->assertNotFound();

    expect($foreignColumn->fresh()->position)->not->toBe(99);
});
