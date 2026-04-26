<?php

namespace App\Http\Controllers;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\User;
use App\Services\Projects\SharedProjectPayloadBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    /**
     * Render the public community feed.
     *
     * Example: GET /community.
     */
    public function feed(SharedProjectPayloadBuilder $payloadBuilder): Response
    {
        $posts = $this->publicPosts()
            ->map(fn (CommunityPost $post): array => $payloadBuilder->communityPost($post));

        return Inertia::render('community/feed', ['posts' => $posts->values()]);
    }

    /**
     * Render a public community profile.
     *
     * Example: GET /community/profile/{user}.
     */
    public function profile(User $user, SharedProjectPayloadBuilder $payloadBuilder): Response
    {
        $user->load(['templates']);
        $user->setRelation('projects', $this->publicProjectsFor($user));
        $user->setRelation('posts', $this->serializedPostsFor($user, $payloadBuilder));

        return Inertia::render('community/profile', ['user' => $user]);
    }

    private function publicPosts(): EloquentCollection
    {
        return CommunityPost::with(['images', 'members', 'project'])
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->latest()
            ->get();
    }

    private function publicProjectsFor(User $user): EloquentCollection
    {
        return $user->projects()
            ->where('visibility', ProjectVisibility::PUBLIC->value)
            ->with('members')
            ->get();
    }

    private function publicPostsFor(User $user): EloquentCollection
    {
        return $user->posts()
            ->with(['images', 'members', 'project'])
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->latest()
            ->get();
    }

    private function serializedPostsFor(User $user, SharedProjectPayloadBuilder $payloadBuilder): Collection
    {
        return $this->publicPostsFor($user)
            ->map(fn (CommunityPost $post): array => $payloadBuilder->communityPost($post))
            ->values();
    }
}
