<?php

namespace App\Http\Middleware;

use App\Services\NotificationFeed;
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
}
