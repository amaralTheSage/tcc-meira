<?php

use App\Events\ProjectDocumentSaved;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\BackendFixtures as Backend;

it('renders the docs workspace with the project default document', function () {
    [$user, $project] = Backend::projectWithMember();
    $document = $project->documents()->firstOrFail();

    $this->actingAs($user)
        ->get(route('docs', $project))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('project/docs')
            ->where('activeDocument.id', $document->id)
            ->where('documents.0.id', $document->id));
});

it('creates project documents with an initial revision', function () {
    [$user, $project] = Backend::projectWithMember();

    $this->actingAs($user)
        ->post(route('docs.store', $project), ['title' => 'Runbook'])
        ->assertRedirect();

    $document = $project->documents()->where('title', 'Runbook')->firstOrFail();
    expect($document->markdown)->toStartWith('# Runbook');
    expect($document->revisions()->where('version', 1)->exists())->toBeTrue();
});

it('renames documents without changing markdown content', function () {
    [$user, $project] = Backend::projectWithMember();
    $document = Backend::document($project, ['markdown' => '# Original']);

    $this->actingAs($user)
        ->patch(route('docs.update', [$project, $document]), ['title' => 'Updated'])
        ->assertRedirect();

    expect($document->fresh())->title->toBe('Updated')->markdown->toBe('# Original');
});

it('saves markdown when the client version is current', function () {
    Event::fake([ProjectDocumentSaved::class]);
    [$user, $project] = Backend::projectWithMember();
    $document = Backend::document($project, ['version' => 3]);

    $this->actingAs($user)
        ->patchJson(route('docs.content.update', [$project, $document]), [
            'markdown' => '# Updated',
            'base_version' => 3,
        ])
        ->assertOk()
        ->assertJsonPath('document.version', 4);

    expect($document->fresh())->markdown->toBe('# Updated')->version->toBe(4);
    expect($document->revisions()->where('version', 4)->exists())->toBeTrue();
    Event::assertDispatched(ProjectDocumentSaved::class);
});

it('rejects stale document saves with the latest document version', function () {
    [$user, $project] = Backend::projectWithMember();
    $document = Backend::document($project, ['version' => 2, 'markdown' => '# Server']);

    $this->actingAs($user)
        ->patchJson(route('docs.content.update', [$project, $document]), [
            'markdown' => '# Client',
            'base_version' => 1,
        ])
        ->assertConflict()
        ->assertJsonPath('document.version', 2);

    expect($document->fresh()->markdown)->toBe('# Server');
});

it('stores uploaded document assets on the public disk', function () {
    Storage::fake('public');
    [$user, $project] = Backend::projectWithMember();
    $document = Backend::document($project);
    $file = UploadedFile::fake()->create('diagram.png', 4, 'image/png');

    $response = $this->actingAs($user)
        ->post(route('docs.assets.store', [$project, $document]), ['file' => $file])
        ->assertOk()
        ->assertJsonPath('asset.original_name', 'diagram.png');

    $path = $response->json('asset.path');
    Storage::disk('public')->assertExists($path);
});

it('redirects to a remaining document after deleting the active document', function () {
    [$user, $project] = Backend::projectWithMember();
    $deletedDocument = $project->documents()->firstOrFail();
    $fallbackDocument = Backend::document($project, ['title' => 'Runbook']);

    $this->actingAs($user)
        ->delete(route('docs.destroy', [$project, $deletedDocument]))
        ->assertRedirect(route('docs.show', [$project, $fallbackDocument]));

    expect($deletedDocument->fresh())->toBeNull();
});

it('guards documents from other projects and the last document deletion', function () {
    [$user, $project] = Backend::projectWithMember();
    [, $otherProject] = Backend::projectWithMember();
    $foreignDocument = $otherProject->documents()->firstOrFail();
    $lastDocument = $project->documents()->firstOrFail();

    $this->actingAs($user)
        ->get(route('docs.show', [$project, $foreignDocument]))
        ->assertNotFound();

    $this->actingAs($user)
        ->delete(route('docs.destroy', [$project, $lastDocument]))
        ->assertStatus(422);
});
