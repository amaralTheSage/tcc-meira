<?php

namespace App\Http\Controllers;

use App\Enums\ProjectVisibility;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ProjectMemberInvitationService;
use App\Services\Projects\ProjectPublisher;
use App\Services\Projects\ProjectTemplateApplier;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\RequiredIf;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Render the authenticated user's project dashboard.
     *
     * Example: GET /home.
     */
    public function index(): Response
    {
        $projects = Auth::user()->projects()->with('members')->get();
        $users = User::whereNot('id', Auth::id())->limit(10)->get();

        return Inertia::render('home', [
            'projects' => $projects,
            'users' => $users,
            'templates' => ProjectTemplate::with('user')->get(),
        ]);
    }

    /**
     * Create a project and invite selected collaborators.
     *
     * Example: POST /projects with title and selectedUsers.
     */
    public function store(Request $request, NotificationService $notifications, ProjectMemberInvitationService $invitations): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'selectedUsers' => ['nullable', 'array'],
            'selectedUsers.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $project = Project::create(['title' => $validated['title']]);
        $project->members()->attach($request->user());
        $invitations->inviteUsers($project, $request->user(), $validated['selectedUsers'] ?? [], $notifications);

        return to_route('traceboard', ['project' => $project]);
    }

    /**
     * Render project settings.
     *
     * Example: GET /{project}/project-settings.
     */
    public function edit(Project $project): Response
    {
        return Inertia::render('project/project-settings', [
            'project' => $project->load([
                'members',
                'communityPost.images',
                'invitations' => fn ($query) => $query
                    ->where('status', 'pending')
                    ->with('invitee'),
            ]),
        ]);
    }

    /**
     * Update project canvas settings.
     *
     * Example: PATCH /{project}/project-settings.
     */
    public function update(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'edge_type' => ['in:bezier,straight,step,smoothstep,default'],
            'animated_edges' => ['boolean'],
        ]);

        $project->update($validated);

        return back();
    }

    /**
     * Redirect legacy sharing URLs to the project settings visibility controls.
     *
     * Example: GET /{project}/publish.
     */
    public function publishingForm(Project $project): RedirectResponse
    {
        return to_route('project-settings', $project);
    }

    /**
     * Publish a project to the community feed.
     *
     * Example: POST /{project}/publish.
     */
    public function publish(Project $project, Request $request, ProjectPublisher $publisher): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => [$this->descriptionRequirement($request), 'nullable', 'string', 'min:1'],
            'visibility' => ['sometimes', Rule::in($this->visibilityValues())],
            'create_template' => ['boolean'],
            'images' => ['sometimes', 'array'],
            'images.*' => ['nullable', $this->publishImageRule()],
        ]);
        $validated['visibility'] ??= ProjectVisibility::PUBLIC->value;
        $validated['description'] ??= $project->communityPost?->description ?? '';

        $publisher->publish($project, $validated, $request->user());

        return to_route('project-settings', $project)
            ->with('success', 'Project sharing updated successfully!');
    }

    /**
     * Apply a template to a new project.
     *
     * Example: POST /templates/{template}/apply.
     */
    public function applyTemplate(ProjectTemplate $template, ProjectTemplateApplier $applier): RedirectResponse
    {
        $project = $applier->apply($template, Auth::user());

        return redirect()->route('traceboard', $project);
    }

    /**
     * Render the project Kanban board.
     *
     * Example: GET /{project}/kanban.
     */
    public function kanban(Project $project): Response
    {
        $columns = $project->columns()->with(['tasks.users', 'tasks.tags'])->orderBy('position')->get();

        return Inertia::render('project/kanban', [
            'project' => $project->load('members'),
            'columns' => $columns,
        ]);
    }

    /**
     * Delete a project.
     *
     * Example: DELETE /{project}/delete.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return to_route('home');
    }

    /**
     * @return array<int, string>
     */
    private function visibilityValues(): array
    {
        $cases = ProjectVisibility::cases();
        $values = array_map(fn (ProjectVisibility $visibility): string => $visibility->value, $cases);

        return $values;
    }

    private function descriptionRequirement(Request $request): RequiredIf
    {
        $visibility = $request->input('visibility', ProjectVisibility::PUBLIC->value);

        return Rule::requiredIf($visibility !== ProjectVisibility::PRIVATE->value);
    }

    private function publishImageRule(): Closure
    {
        return function (string $attribute, object|array|string|int|float|bool|null $value, Closure $fail): void {
            if ($this->isStoredImagePath($value) || $this->isValidUploadedImage($value)) {
                return;
            }

            $fail("The {$attribute} field must be an image upload under 5MB or an existing image path.");
        };
    }

    private function isStoredImagePath(object|array|string|int|float|bool|null $value): bool
    {
        return is_string($value) && $value !== '';
    }

    private function isValidUploadedImage(object|array|string|int|float|bool|null $value): bool
    {
        if (! $value instanceof UploadedFile) {
            return false;
        }

        return str_starts_with($value->getMimeType() ?? '', 'image/')
            && ($value->getSize() ?? 0) <= 5 * 1024 * 1024;
    }
}
