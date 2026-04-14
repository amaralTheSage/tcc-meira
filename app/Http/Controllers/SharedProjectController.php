<?php

namespace App\Http\Controllers;

use App\Enums\ProjectVisibility;
use App\Models\Column;
use App\Models\Project;
use App\Models\ProjectDocument;
use App\Services\Projects\ProjectPayloadCloner;
use App\Services\Projects\ProjectTemplatePayloadBuilder;
use App\Services\Projects\ProjectViewRecorder;
use App\Services\Projects\SharedProjectPayloadBuilder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SharedProjectController extends Controller
{
    public function __construct(
        private readonly ProjectViewRecorder $viewRecorder,
        private readonly SharedProjectPayloadBuilder $payloadBuilder,
    ) {}

    /**
     * Render the shared Traceboard entry page.
     *
     * Example: GET /p/{share_token}.
     */
    public function show(string $shareToken, Request $request): Response
    {
        return $this->traceboard($shareToken, $request);
    }

    /**
     * Render a read-only shared Traceboard.
     *
     * Example: GET /p/{share_token}/traceboard.
     */
    public function traceboard(string $shareToken, Request $request): Response
    {
        $project = $this->sharedProject($shareToken)->load($this->traceboardRelations());
        $this->viewRecorder->record($project, $request);

        return Inertia::render('shared-project/traceboard', [
            'project' => array_merge($this->payloadBuilder->project($project), [
                'tasks' => $project->tasks,
                'notes' => $project->notes,
                'sprints' => $project->sprints,
            ]),
        ]);
    }

    /**
     * Render a read-only shared Kanban board.
     *
     * Example: GET /p/{share_token}/kanban.
     */
    public function kanban(string $shareToken, Request $request): Response
    {
        $project = $this->sharedProject($shareToken)->load($this->baseRelations());
        $this->viewRecorder->record($project, $request);

        return Inertia::render('shared-project/kanban', [
            'project' => $this->payloadBuilder->project($project),
            'columns' => $this->projectColumns($project),
        ]);
    }

    /**
     * Render shared project pins without edit controls.
     *
     * Example: GET /p/{share_token}/pins.
     */
    public function pins(string $shareToken, Request $request): Response
    {
        $project = $this->sharedProject($shareToken)->load($this->baseRelations());
        $this->viewRecorder->record($project, $request);

        return Inertia::render('shared-project/pins', [
            'project' => $this->payloadBuilder->project($project),
            'pins' => $project->pins()->orderBy('position')->get(),
        ]);
    }

    /**
     * Render shared project documents as read-only markdown.
     *
     * Example: GET /p/{share_token}/docs.
     */
    public function docs(string $shareToken, Request $request): Response
    {
        $project = $this->sharedProject($shareToken)->load($this->baseRelations());
        $activeDocument = $this->defaultDocument($project);
        $this->viewRecorder->record($project, $request);

        return Inertia::render('shared-project/docs', [
            'project' => $this->payloadBuilder->project($project),
            'documents' => $project->documents()->orderBy('title')->get(),
            'activeDocument' => $activeDocument,
        ]);
    }

    /**
     * Download a shared project as native Meira JSON.
     *
     * Example: GET /p/{share_token}/export.
     */
    public function export(string $shareToken, ProjectTemplatePayloadBuilder $builder): JsonResponse
    {
        $project = $this->sharedProject($shareToken)->load($this->baseRelations());
        $fileName = Str::slug($project->title).'-meira-export.json';

        return response()->json($this->exportPayload($project, $builder))
            ->header('Content-Disposition', "attachment; filename=\"{$fileName}\"");
    }

    /**
     * Copy a shared project into a private editable project for the user.
     *
     * Example: POST /p/{share_token}/copy.
     */
    public function copy(string $shareToken, Request $request, ProjectTemplatePayloadBuilder $builder, ProjectPayloadCloner $cloner): RedirectResponse
    {
        $sourceProject = $this->sharedProject($shareToken);
        $project = $cloner->clone($builder->build($sourceProject), $request->user(), $sourceProject->title.' Copy');

        return to_route('traceboard', $project);
    }

    private function sharedProject(string $shareToken): Project
    {
        $project = Project::where('share_token', $shareToken)
            ->whereIn('visibility', [ProjectVisibility::LINK_ONLY->value, ProjectVisibility::PUBLIC->value])
            ->first();

        abort_if($project === null, 404, "Shared project token {$shareToken} was not found; expected link_only or public project.");

        return $project;
    }

    /**
     * @return array<int, string>
     */
    private function baseRelations(): array
    {
        return ['members', 'communityPost.images', 'communityPost.members'];
    }

    /**
     * @return array<int, string>
     */
    private function traceboardRelations(): array
    {
        return [...$this->baseRelations(), 'tasks.targets', 'tasks.tags', 'notes', 'sprints'];
    }

    private function projectColumns(Project $project): Collection
    {
        return Column::where('project_id', $project->id)
            ->with(['tasks.subtasks.users', 'tasks.tags', 'tasks.users'])
            ->orderBy('position')
            ->get();
    }

    private function defaultDocument(Project $project): ProjectDocument
    {
        $document = $project->documents()->oldest()->first();

        abort_if($document === null, 404, "Shared project {$project->id} has no document; expected at least one project document.");

        return $document;
    }

    /**
     * @return array<string, scalar|null|array<string, scalar|null>|array<string, array<int, array<string, scalar|null>|object>>>
     */
    private function exportPayload(Project $project, ProjectTemplatePayloadBuilder $builder): array
    {
        return [
            'schema_version' => 'meira.v1',
            'exported_at' => now()->toISOString(),
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
                'visibility' => $project->visibility->value,
                'share_url' => route('shared.show', $project->share_token),
            ],
            'data' => $builder->build($project),
        ];
    }
}
