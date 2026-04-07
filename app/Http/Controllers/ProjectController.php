<?php

namespace App\Http\Controllers;

use App\Enums\ProjectInvitationStatus;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectTemplate;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\Projects\ProjectPublisher;
use App\Services\Projects\ProjectTemplateApplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $users = User::whereNot('id', Auth::id())->paginate(10);

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
    public function store(Request $request, NotificationService $notifications): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'selectedUsers' => ['nullable', 'array'],
            'selectedUsers.*' => ['integer', 'distinct', 'exists:users,id'],
        ]);

        $project = Project::create(['title' => $validated['title']]);
        $project->members()->attach($request->user());
        $this->inviteSelectedUsers($project, $request, $validated['selectedUsers'] ?? [], $notifications);

        return to_route('traceboard', ['project' => $project]);
    }

    /**
     * Render project settings.
     *
     * Example: GET /{project}/project-settings.
     */
    public function edit(Project $project): Response
    {
        return Inertia::render('project/project-settings', ['project' => $project->load('members')]);
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
     * Render the project publishing form.
     *
     * Example: GET /{project}/publish.
     */
    public function publishingForm(Project $project): Response
    {
        return Inertia::render('project/publish', ['project' => $project->load('members')]);
    }

    /**
     * Publish a project to the community feed.
     *
     * Example: POST /{project}/publish.
     */
    public function publish(Project $project, Request $request, ProjectPublisher $publisher): Response
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:200'],
            'create_template' => ['boolean'],
            'images' => ['required', 'array'],
        ]);

        $publisher->publish($project, $validated, $request->user());

        return Inertia::render('community/profile', [
            'user' => $request->user()->load('projects'),
        ])->with('success', 'Project published successfully!');
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
     * @param  array<int, int>  $selectedUserIds
     */
    private function inviteSelectedUsers(Project $project, Request $request, array $selectedUserIds, NotificationService $notifications): void
    {
        User::whereKey($this->inviteeIds($selectedUserIds, $request->user()->id))
            ->get()
            ->each(fn (User $invitee) => $notifications->sendProjectInvite(
                $this->createProjectInvitation($project, $request->user()->id, $invitee->id)
            ));
    }

    /**
     * @param  array<int, int>  $selectedUserIds
     * @return array<int, int>
     */
    private function inviteeIds(array $selectedUserIds, int $ownerId): array
    {
        return collect($selectedUserIds)
            ->unique()
            ->reject(fn (int $userId): bool => $userId === $ownerId)
            ->values()
            ->all();
    }

    private function createProjectInvitation(Project $project, int $inviterId, int $inviteeId): ProjectInvitation
    {
        return ProjectInvitation::updateOrCreate([
            'project_id' => $project->id,
            'invitee_id' => $inviteeId,
        ], [
            'inviter_id' => $inviterId,
            'status' => ProjectInvitationStatus::PENDING,
            'accepted_at' => null,
            'declined_at' => null,
        ]);
    }
}
