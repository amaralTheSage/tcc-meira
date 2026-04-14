<?php

namespace Database\Seeders;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class CommunityFeedSeeder extends Seeder
{
    private const COMMUNITY_EXAMPLES = [
        [
            'email' => 'test@example.com',
            'share_token' => 'community-realtime-cursors',
            'title' => 'How we built real-time cursors with Laravel Reverb',
            'description' => 'A deep-dive into how we implemented live cursor positions across the Traceboard using Laravel Reverb presence channels and React. Lessons learned and pitfalls to avoid.',
        ],
        [
            'email' => 'alice@example.com',
            'share_token' => 'community-kanban-productivity',
            'title' => '5 Tips for Better Kanban productivity',
            'description' => 'After using Meira with my team for a few sprints, here are five practical tips to keep your Kanban board clean, fast, and actionable. Don’t let tasks sit in "ToDo" for too long!',
        ],
        [
            'email' => 'bob@example.com',
            'share_token' => 'community-react-flow-d3',
            'title' => 'React Flow vs D3.js for node graphs',
            'description' => 'We used React Flow for the Traceboard feature. Here is what we learned about node state management, performance optimization, and custom edge rendering. Why we chose React Flow over raw D3.',
        ],
        [
            'email' => 'diana@example.com',
            'share_token' => 'community-websocket-scaling',
            'title' => 'Scaling WebSocket connections at Meira',
            'description' => 'How we tuned our server to handle thousands of concurrent WebSocket connections for real-time collaboration. Insights from our recent horizontal scaling tests.',
        ],
        [
            'email' => 'test@example.com',
            'share_token' => 'community-remote-sprint-planning',
            'title' => 'Sprint Planning for remote-first teams',
            'description' => 'Sprint planning does not have to be a 3-hour meeting. Here is our lightweight process using task goals, story points, and time-boxed discussions in Meira.',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::COMMUNITY_EXAMPLES as $example) {
            $this->seedCommunityExample($example);
        }
    }

    /**
     * @param  array{email: string, share_token: string, title: string, description: string}  $example
     */
    private function seedCommunityExample(array $example): void
    {
        $user = $this->requiredSeedUser($example['email']);
        $project = $this->upsertProject($example);
        $project->members()->sync([$user->id]);

        $post = CommunityPost::updateOrCreate(['project_id' => $project->id], [
            'title' => $example['title'],
            'description' => $example['description'],
        ]);
        $post->members()->sync([$user->id]);
    }

    /**
     * @param  array{share_token: string, title: string}  $example
     */
    private function upsertProject(array $example): Project
    {
        return Project::updateOrCreate(['share_token' => $example['share_token']], [
            'title' => $example['title'],
            'visibility' => ProjectVisibility::PUBLIC,
            'published_at' => now(),
        ]);
    }

    private function requiredSeedUser(string $email): User
    {
        $user = User::where('email', $email)->first();

        if ($user instanceof User) {
            return $user;
        }

        throw new RuntimeException("Missing seeded user [{$email}], expected UserSeeder to run first.");
    }
}
