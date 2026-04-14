<?php

namespace App\Services\Projects;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectPublisher
{
    public function __construct(private readonly ProjectTemplatePayloadBuilder $payloadBuilder) {}

    /**
     * Publish the project to the community feed and optionally create a template.
     *
     * Example: $publisher->publish($project, $payload, $user);
     *
     * @param  array{title: string, description: string, visibility?: string, create_template?: bool, images?: array<int, UploadedFile|string>}  $validated
     */
    public function publish(Project $project, array $validated, User $user): CommunityPost
    {
        $visibility = ProjectVisibility::from($validated['visibility'] ?? ProjectVisibility::PUBLIC->value);
        $this->updateVisibility($project, $visibility);

        if ($validated['create_template'] ?? false) {
            $this->createTemplate($project, $validated['title'], $user);
        }

        $post = $this->createCommunityPost($project, $validated);
        $this->replaceImagesWhenProvided($post, $validated['images'] ?? []);

        return $post;
    }

    private function createTemplate(Project $project, string $title, User $user): ProjectTemplate
    {
        return ProjectTemplate::create([
            'user_id' => $user->id,
            'name' => 'Template '.$title,
            'project_id' => $project->id,
            'data' => $this->payloadBuilder->build($project),
        ]);
    }

    /**
     * @param  array{title: string, description: string}  $validated
     */
    private function createCommunityPost(Project $project, array $validated): CommunityPost
    {
        $post = CommunityPost::updateOrCreate([
            'project_id' => $project->id,
        ], [
            'title' => $validated['title'],
            'description' => $validated['description'],
        ]);

        $post->members()->sync($project->members()->pluck('users.id')->all());

        return $post;
    }

    private function updateVisibility(Project $project, ProjectVisibility $visibility): void
    {
        $project->forceFill([
            'visibility' => $visibility,
            'share_token' => $this->shareToken($project, $visibility),
            'published_at' => $this->publishedAt($project, $visibility),
        ])->save();
    }

    private function shareToken(Project $project, ProjectVisibility $visibility): ?string
    {
        if ($visibility === ProjectVisibility::PRIVATE) {
            return null;
        }

        return $project->share_token ?? $this->uniqueShareToken();
    }

    private function publishedAt(Project $project, ProjectVisibility $visibility): ?Carbon
    {
        if ($visibility === ProjectVisibility::PRIVATE) {
            return $project->published_at;
        }

        return $project->published_at ?? now();
    }

    private function uniqueShareToken(): string
    {
        do {
            $token = Str::random(48);
        } while (Project::where('share_token', $token)->exists());

        return $token;
    }

    /**
     * @param  array<int, UploadedFile|string>  $images
     */
    private function replaceImagesWhenProvided(CommunityPost $post, array $images): void
    {
        if ($images === []) {
            return;
        }

        $post->images()->delete();

        foreach ($images as $image) {
            $post->images()->create(['image_id' => $this->imageIdentifier($post, $image)]);
        }
    }

    private function imageIdentifier(CommunityPost $post, UploadedFile|string $image): string
    {
        if ($image instanceof UploadedFile) {
            return Storage::disk('public')->putFile('community/'.$post->id, $image);
        }

        return $image;
    }
}
