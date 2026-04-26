<?php

namespace Database\Seeders;

use App\Models\CommunityPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class CommunityFeedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::where('email', 'test@example.com')->first();
        $alice = User::where('email', 'alice@example.com')->first();
        $bob = User::where('email', 'bob@example.com')->first();
        $diana = User::where('email', 'diana@example.com')->first();

        $posts = [
            [
                'user' => $testUser,
                'title' => 'How we built real-time cursors with Laravel Reverb',
                'description' => 'A deep-dive into how we implemented live cursor positions across the Traceboard using Laravel Reverb presence channels and React. Lessons learned and pitfalls to avoid.',
            ],
            [
                'user' => $alice,
                'title' => '5 Tips for Better Kanban productivity',
                'description' => 'After using Meira with my team for a few sprints, here are five practical tips to keep your Kanban board clean, fast, and actionable. Don’t let tasks sit in "ToDo" for too long!',
            ],
            [
                'user' => $bob,
                'title' => 'React Flow vs D3.js for node graphs',
                'description' => 'We used React Flow for the Traceboard feature. Here is what we learned about node state management, performance optimization, and custom edge rendering. Why we chose React Flow over raw D3.',
            ],
            [
                'user' => $diana,
                'title' => 'Scaling WebSocket connections at Meira',
                'description' => 'How we tuned our server to handle thousands of concurrent WebSocket connections for real-time collaboration. Insights from our recent horizontal scaling tests.',
            ],
            [
                'user' => $testUser,
                'title' => 'Sprint Planning for remote-first teams',
                'description' => 'Sprint planning does not have to be a 3-hour meeting. Here is our lightweight process using task goals, story points, and time-boxed discussions in Meira.',
            ],
        ];

        foreach ($posts as $postData) {
            $post = CommunityPost::create([
                'title' => $postData['title'],
                'description' => $postData['description'],
            ]);

            $post->members()->attach($postData['user']->id);
        }

        // Add some random extra posts
        CommunityPost::factory(4)->create()->each(function ($post) {
            $randomUser = User::inRandomOrder()->first();
            $post->members()->attach($randomUser->id);
        });
    }
}
