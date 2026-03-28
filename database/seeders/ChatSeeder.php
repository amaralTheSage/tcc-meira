<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $project = Project::where('title', 'Meira Demo Project')->first();
        $testUser = User::where('email', 'test@example.com')->first();
        $alice = User::where('email', 'alice@example.com')->first();
        $bob = User::where('email', 'bob@example.com')->first();
        $charlie = User::where('email', 'charlie@example.com')->first();
        $diana = User::where('email', 'diana@example.com')->first();

        $chat = $project->chat;

        $messages = [
            [$testUser, 'Hey team! Welcome to the Meira project chat. I’ve just finished the basic scaffolding and pushed it to the repo. 🚀'],
            [$alice, 'Great start! I’m going to focus on the Kanban board UI today. Should we use the default React Flow nodes or custom ones?'],
            [$bob, 'I think custom nodes are better. We need more control over the task styling and ports if we want it to look premium.'],
            [$testUser, 'Agreed. Custom nodes will allow us to add those nice micro-animations we discussed. Charlie, did you have those design assets ready?'],
            [$charlie, 'Pushed the mockups to Figma! Link is pinned in the project. 🎨'],
            [$alice, 'Reviewing now... wow, the Traceboard graph looks sick! How are we handling those animated edges?'],
            [$bob, 'Using the built-in animated prop in React Flow for now. We might need a custom edge component for those dashed lines though.'],
            [$diana, 'Hey folks! I’m looking into the Reverb setup for the multi-player sync. If anyone needs to test real-time features, you’ll need to run `php artisan reverb:start` locally.'],
            [$testUser, 'Thanks Diana. Bob, just a reminder to debounce the spatial position updates. We don’t want to hammer the database on every mouse pixel movement.'],
            [$bob, 'On it! Setting it to 500ms debounce. Feels much smoother now. 💨'],
            [$alice, 'I’ve finished the column reordering API. It’s super snappy with Inertia v2 defer props.'],
            [$testUser, 'Awesome progress everyone. I’m starting to work on the WorkOS integration for SSO and magic-link login. It should make onboarding much smoother for our beta users.'],
            [$diana, 'I just pushed the first draft of the live cursors. It’s currently in a custom presence channel. Let me know if you see any lag!'],
            [$bob, 'Just took a look at the cursors. They are buttery smooth! Great job Diana. 🖱️'],
            [$charlie, 'The color palette for the tags has been updated in the database. Bug is now red, Feature is blue, and Refactor is emerald.'],
            [$testUser, 'Looks good. If there are no blockers, I think we can aim for a staging deploy by Friday. What do you think?'],
            [$alice, 'Count me in. Just a few more UI tweaks on the Kanban subtasks and I’m ready.'],
            [$bob, 'Traceboard graph is solid. Just need to polish those edge handles as Alice mentioned in her review.'],
            [$diana, 'Notifications are wired up too. Mention me here and you should see a toast popup!'],
            [$testUser, 'Let’s do it. Sprint 1 is looking like a total win. 🎯'],
        ];

        foreach ($messages as $index => [$user, $content]) {
            Message::create([
                'chat_id' => $chat->id,
                'user_id' => $user->id,
                'content' => $content,
                'image' => null,
                'created_at' => now()->subDays(5)->addHours($index * 4),
                'updated_at' => now()->subDays(5)->addHours($index * 4),
            ]);
        }
    }
}
