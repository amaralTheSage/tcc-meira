<?php

namespace App\Http\Controllers;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\User;
use App\Services\CollaborationHistoryService;
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
    public function feed(
        Request $request,
        SharedProjectPayloadBuilder $payloadBuilder,
        CollaborationHistoryService $collaborations,
    ): Response {
        return Inertia::render('community/feed', [
            'posts' => $this->serializedPosts($this->publicPosts(), $payloadBuilder),
            'collaboratorPosts' => $this->collaboratorPosts($request->user(), $payloadBuilder, $collaborations),
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
        return CommunityPost::with($this->postRelations())
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->latest()
            ->get();
    }

    private function collaboratorPosts(
        ?User $user,
        SharedProjectPayloadBuilder $payloadBuilder,
        CollaborationHistoryService $collaborations,
    ): Collection {
        if ($user === null) {
            return collect();
        }

        return $this->serializedPosts($this->publicPostsForCollaborators($user, $collaborations), $payloadBuilder);
    }

    private function publicPostsForCollaborators(User $user, CollaborationHistoryService $collaborations): EloquentCollection
    {
        $collaboratorIds = $collaborations->collaboratorIdsFor($user);

        return CommunityPost::with($this->postRelations())
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->whereHas('members', fn (Builder $query): Builder => $query->whereIn('users.id', $collaboratorIds))
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
            ->with($this->postRelations())
            ->whereHas('project', fn (Builder $query): Builder => $query->where('visibility', ProjectVisibility::PUBLIC->value))
            ->latest()
            ->get();
    }

    /**
     * @return array<int, string>
     */
    private function postRelations(): array
    {
        return ['images', 'members', 'project.tasks.sprint', 'project.tasks.subtasks', 'project.tasks.targets', 'project.notes'];
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
