<?php

namespace App\Http\Controllers;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\User;
use App\Services\Projects\SharedProjectPayloadBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\Request;
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
    public function feed(Request $request, SharedProjectPayloadBuilder $payloadBuilder): Response
    {
        return Inertia::render('community/feed', [
            'posts' => $this->serializedPosts($this->publicPosts(), $payloadBuilder),
            'friendPosts' => $this->friendPosts($request->user(), $payloadBuilder),
        ]);
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

    private function friendPosts(?User $user, SharedProjectPayloadBuilder $payloadBuilder): Collection
    {
        if ($user === null) {
            return collect();
        }

        return $this->serializedPosts($this->publicPostsForFriends($user), $payloadBuilder);
    }

    private function publicPostsForFriends(User $user): EloquentCollection
    {
        $friendIds = $user->friends()->pluck('users.id')->all();

        return CommunityPost::with(['images', 'members', 'project'])
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->whereHas('members', fn (Builder $query): Builder => $query->whereIn('users.id', $friendIds))
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
        return $this->serializedPosts($this->publicPostsFor($user), $payloadBuilder);
    }

    private function serializedPosts(EloquentCollection $posts, SharedProjectPayloadBuilder $payloadBuilder): Collection
    {
        return $posts->map(fn (CommunityPost $post): array => $payloadBuilder->communityPost($post))->values();
    }
}
