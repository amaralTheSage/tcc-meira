<?php

namespace App\Services\Projects;

use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;

class ProjectPublisher
{
    public function __construct(private readonly ProjectTemplatePayloadBuilder $payloadBuilder) {}

    /**
     * Publish the project to the community feed and optionally create a template.
     *
     * Example: $publisher->publish($project, $payload, $user);
     *
     * @param  array{title: string, description: string, create_template?: bool, images?: array<int, object|string>}  $validated
     */
    public function publish(Project $project, array $validated, User $user): CommunityPost
    {
        if ($validated['create_template'] ?? false) {
            $this->createTemplate($project, $validated['title'], $user);
        }

        return $this->createCommunityPost($project, $validated);
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
        $post = CommunityPost::create($validated);
        $post->members()->attach($project->members);

        return $post;
    }
}
