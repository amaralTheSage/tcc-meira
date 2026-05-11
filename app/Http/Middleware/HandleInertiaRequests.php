<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Services\NotificationFeed;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => fn (): array => $this->notifications($request),
            'projectUndo' => fn (): array => $this->projectUndo($request),
            'projectSwitcher' => fn (): array => $this->projectSwitcher($request),
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'newTask' => fn () => $request->session()->get('newTask'),
                'updatedTask' => fn () => $request->session()->get('updatedTask'),
                'tag' => fn () => $request->session()->get('tag'),
            ],
        ];
    }

    /**
     * Share the current user's notification feed with every Inertia page.
     *
     * Example: usePage<SharedData>().props.notifications.
     */
    private function notifications(Request $request): array
    {
        if ($request->user() === null) {
            return ['items' => [], 'unread_count' => 0];
        }

        return app(NotificationFeed::class)->recentFor($request->user());
    }

    /**
     * Share the latest undoable action for the current project route.
     *
     * Example: usePage<SharedData>().props.projectUndo.can_undo.
     *
     * @return array{can_undo: bool, label?: string}
     */
    private function projectUndo(Request $request): array
    {
        $project = $this->routeProject($request);
        if ($request->user() === null || $project === null) {
            return ['can_undo' => false];
        }

        return app(ProjectUndoRecorder::class)->summary($project, $request->user());
    }

    private function routeProject(Request $request): ?Project
    {
        $project = $request->route('project');

        return $project instanceof Project ? $project : null;
    }

    /**
     * Share lightweight projects for quick workspace switching.
     *
     * Example: usePage<SharedData>().props.projectSwitcher.projects.
     *
     * @return array{projects: array<int, array{id: string, title: string}>}
     */
    private function projectSwitcher(Request $request): array
    {
        $user = $request->user();
        if ($user === null) {
            return ['projects' => []];
        }

        $projects = $user->projects()
            ->select(['projects.id', 'projects.title'])
            ->orderBy('projects.title')
            ->get()
            ->map(fn (Project $project): array => ['id' => (string) $project->id, 'title' => $project->title])
            ->values()
            ->all();

        return ['projects' => $projects];
    }
}
