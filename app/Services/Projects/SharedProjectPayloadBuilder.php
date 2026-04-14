<?php

namespace App\Services\Projects;

use App\Models\CommunityPost;
use App\Models\CommunityPostImage;
use App\Models\Project;
use App\Models\User;

class SharedProjectPayloadBuilder
{
    /**
     * Build the public project metadata consumed by read-only shared pages.
     *
     * Example: $payload = $builder->project($project).
     *
     * @return array<string, scalar|null|array<string, scalar|null|array<int, array<string, scalar|null>>>|array<int, array<string, scalar|null>>>
     */
    public function project(Project $project): array
    {
        $post = $project->communityPost;

        return [
            'id' => $project->id,
            'title' => $project->title,
            'visibility' => $project->visibility->value,
            'share_token' => $project->share_token,
            'share_url' => route('shared.show', $project->share_token),
            'public_views_count' => $project->public_views_count,
            'published_at' => $project->published_at?->toISOString(),
            'members' => $project->members->map(fn (User $user): array => $this->user($user))->values()->all(),
            'publication' => $this->publication($project, $post),
            'edge_type' => $project->edge_type,
            'animated_edges' => (bool) $project->animated_edges,
        ];
    }

    /**
     * Build a community post card payload with real project metadata.
     *
     * Example: $payload = $builder->communityPost($post).
     *
     * @return array<string, scalar|null|array<int, array<string, scalar|null>>>
     */
    public function communityPost(CommunityPost $post): array
    {
        return [
            'id' => $post->id,
            'project_id' => $post->project_id,
            'title' => $post->title,
            'description' => $post->description,
            'share_url' => route('shared.show', $post->project->share_token),
            'public_views_count' => $post->project->public_views_count,
            'published_at' => $post->project->published_at?->toISOString(),
            'members' => $post->members->map(fn (User $user): array => $this->user($user))->values()->all(),
            'images' => $post->images->map(fn (CommunityPostImage $image): array => $this->image($image))->values()->all(),
        ];
    }

    /**
     * @return array<string, scalar|null|array<int, array<string, scalar|null>>>
     */
    private function publication(Project $project, ?CommunityPost $post): array
    {
        return [
            'title' => $post?->title ?? $project->title,
            'description' => $post?->description,
            'images' => $post?->images->map(fn (CommunityPostImage $image): array => $this->image($image))->values()->all() ?? [],
        ];
    }

    /**
     * @return array{id: int, name: string, email: string|null, avatar: string|null}
     */
    private function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
        ];
    }

    /**
     * @return array{id: int|null, image_id: string, url: string}
     */
    private function image(CommunityPostImage $image): array
    {
        return [
            'id' => $image->id,
            'image_id' => $image->image_id,
            'url' => $image->url,
        ];
    }
}
