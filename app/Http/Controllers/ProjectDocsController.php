<?php

namespace App\Http\Controllers;

use App\Events\ProjectDocumentSaved;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProjectDocsController extends Controller
{
    use GuardsProjectResources;

    /**
     * Render the project documentation workspace.
     *
     * Example: GET /{project}/docs.
     */
    public function show(Project $project, ?ProjectDocument $document = null): Response
    {
        $activeDocument = $document ?? $this->defaultDocument($project);
        $this->ensureDocumentBelongsToProject($project, $activeDocument);

        return Inertia::render('project/docs', [
            'project' => $project->load('members'),
            'documents' => $this->orderedDocuments($project),
            'activeDocument' => $activeDocument->fresh(),
        ]);
    }

    /**
     * Create a project-scoped markdown document.
     *
     * Example: POST /{project}/docs with title.
     */
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate($this->titleRules());
        $document = ProjectDocument::createDefaultForProject($project, $request->user(), $validated['title']);
        $document->recordRevision($request->user());

        return to_route('docs.show', [$project, $document]);
    }

    /**
     * Rename an existing project document.
     *
     * Example: PATCH /{project}/docs/{document}.
     */
    public function update(Project $project, ProjectDocument $document, Request $request): RedirectResponse
    {
        $this->ensureDocumentBelongsToProject($project, $document);
        $validated = $request->validate($this->titleRules());
        $document->update($validated);

        return back();
    }

    /**
     * Save markdown content if the client version is current.
     *
     * Example: PATCH /{project}/docs/{document}/content.
     */
    public function updateContent(Project $project, ProjectDocument $document, Request $request): JsonResponse
    {
        $this->ensureDocumentBelongsToProject($project, $document);
        $validated = $request->validate($this->contentRules());

        if ((int) $validated['base_version'] !== $document->version) {
            return $this->conflictResponse($document);
        }

        $document = $this->saveMarkdown($document, $validated['markdown'], $request);
        broadcast(new ProjectDocumentSaved($document, $request->user()))->toOthers();

        return response()->json(['document' => $document]);
    }

    /**
     * Store an uploaded document asset and return its public URL.
     *
     * Example: POST /{project}/docs/{document}/assets with a file field.
     */
    public function storeAsset(Project $project, ProjectDocument $document, Request $request): JsonResponse
    {
        $this->ensureDocumentBelongsToProject($project, $document);
        $validated = $request->validate(['file' => ['required', 'file', 'max:10240']]);
        /** @var UploadedFile $file */
        $file = $validated['file'];
        $path = $file->store("docs/{$project->id}/{$document->id}", 'public');
        $asset = $document->assets()->create($this->assetAttributes($file, $path, $request));

        return response()->json(['asset' => $asset, 'url' => Storage::disk('public')->url($path)]);
    }

    /**
     * Delete a document unless it is the project's last document.
     *
     * Example: DELETE /{project}/docs/{document}.
     */
    public function destroy(Project $project, ProjectDocument $document): RedirectResponse
    {
        $this->ensureDocumentBelongsToProject($project, $document);
        abort_if($project->documents()->count() <= 1, 422, 'Cannot delete last document; expected at least one project document.');
        $document->delete();

        return to_route('docs', $project);
    }

    private function defaultDocument(Project $project): ProjectDocument
    {
        return $project->documents()->oldest()->first()
            ?? ProjectDocument::createDefaultForProject($project);
    }

    private function ensureDocumentBelongsToProject(Project $project, ProjectDocument $document): void
    {
        $this->ensureModelBelongsToProject($project, $document);
    }

    /**
     * @return array<int, ProjectDocument>
     */
    private function orderedDocuments(Project $project): array
    {
        return $project->documents()->orderBy('title')->get()->all();
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function titleRules(): array
    {
        return ['title' => ['required', 'string', 'max:120']];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function contentRules(): array
    {
        return [
            'markdown' => ['required', 'string', 'max:200000'],
            'base_version' => ['required', 'integer', 'min:1'],
        ];
    }

    private function conflictResponse(ProjectDocument $document): JsonResponse
    {
        return response()->json(['document' => $document->fresh()], 409);
    }

    private function saveMarkdown(ProjectDocument $document, string $markdown, Request $request): ProjectDocument
    {
        return DB::transaction(function () use ($document, $markdown, $request): ProjectDocument {
            $document->update([
                'markdown' => $markdown,
                'version' => $document->version + 1,
                'last_edited_by' => $request->user()->id,
            ]);

            $document->recordRevision($request->user());

            return $document->fresh();
        });
    }

    /**
     * @return array<string, int|string|null>
     */
    private function assetAttributes(UploadedFile $file, string $path, Request $request): array
    {
        return [
            'uploaded_by' => $request->user()->id,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
