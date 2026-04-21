<?php

namespace Database\Seeders;

use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Subtask;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DemoProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::where('email', 'test@example.com')->first();
        $alice = User::where('email', 'alice@example.com')->first();
        $bob = User::where('email', 'bob@example.com')->first();
        $charlie = User::where('email', 'charlie@example.com')->first();
        $diana = User::where('email', 'diana@example.com')->first();

        // Create the demo project (boot() auto-creates 4 default columns + a Chat)
        $project = Project::create([
            'title' => 'Meira Demo Project',
            'edge_type' => 'bezier',
            'animated_edges' => true,
        ]);

        // Attach members
        $project->members()->attach([$testUser->id, $alice->id, $bob->id, $charlie->id, $diana->id]);

        // Grab the auto-created columns (created in Project::boot)
        $columns = $project->columns()->orderBy('position')->get()->keyBy('type');
        $backlog = $columns['backlog'];
        $todo = $columns['to_do'];
        $inProgress = $columns['in_progress'];
        $done = $columns['done'];

        // --- Tags ---
        $tagBug = Tag::create(['id' => Str::uuid(), 'name' => 'Bug', 'color' => '#ef4444', 'project_id' => $project->id]);
        $tagFeature = Tag::create(['id' => Str::uuid(), 'name' => 'Feature', 'color' => '#3b82f6', 'project_id' => $project->id]);
        $tagDesign = Tag::create(['id' => Str::uuid(), 'name' => 'Design', 'color' => '#a855f7', 'project_id' => $project->id]);
        $tagUrgent = Tag::create(['id' => Str::uuid(), 'name' => 'Urgent', 'color' => '#f97316', 'project_id' => $project->id]);
        $tagRefactor = Tag::create(['id' => Str::uuid(), 'name' => 'Refactor', 'color' => '#10b981', 'project_id' => $project->id]);

        // --- Sprints ---
        $sprint = Sprint::create([
            'title' => 'Sprint 1 – Core Engine',
            'project_id' => $project->id,
            'start_at' => now()->subDays(7),
            'end_at' => now()->addDays(7),
            'status' => 'active',
            'goal' => 'Ship the core Kanban + Traceboard features to beta users.',
            'color' => '#2563eb',
        ]);

        $sprintTwo = Sprint::create([
            'title' => 'Sprint 2 – Multi-player Sync',
            'project_id' => $project->id,
            'start_at' => now()->addDays(8),
            'end_at' => now()->addDays(22),
            'status' => 'planned',
            'goal' => 'Add real-time cursors, team chat, and notifications.',
            'color' => '#16a34a',
        ]);

        $sprintBacklog = Sprint::create([
            'title' => 'Sprint 3 – Enterprise Polish',
            'project_id' => $project->id,
            'start_at' => now()->addDays(23),
            'end_at' => now()->addDays(37),
            'status' => 'planned',
            'goal' => 'SSO integration, audit logs, and custom export.',
            'color' => '#9333ea',
        ]);

        // Helper to keep track of IDs precisely for connections
        $tasks = [];

        $createTask = function ($data) use ($project, &$tasks) {
            $id = (string) Str::uuid();
            $task = Task::create(array_merge([
                'id' => $id,
                'project_id' => $project->id,
                'x' => 0,
                'y' => 0,
                'status' => 'open',
                'position' => 0,
            ], $data));
            $tasks[$data['title']] = $task;

            return $task;
        };

        // --- Tasks in Backlog ---
        $taskAuth = $createTask([
            'title' => 'Auth with WorkOS',
            'description' => 'Integrate WorkOS for SSO and magic-link login. Validate sessions via middleware.',
            'column_id' => $backlog->id,
            'sprint_id' => $sprintBacklog->id,
            'x' => 100, 'y' => 100,
        ]);

        $taskOnboarding = $createTask([
            'title' => 'User Onboarding Flow',
            'description' => 'Build a step-by-step onboarding wizard for new users.',
            'column_id' => $backlog->id,
            'x' => 100, 'y' => 280,
        ]);

        $taskExports = $createTask([
            'title' => 'PDF Exports for Traceboard',
            'description' => 'Allow users to export their task graph as a high-res PDF.',
            'column_id' => $backlog->id,
            'x' => 100, 'y' => 460,
        ]);

        // --- Tasks in To Do ---
        $taskKanban = $createTask([
            'title' => 'Build Kanban Board',
            'description' => 'Implement drag-and-drop column and task management with React Flow.',
            'column_id' => $todo->id,
            'sprint_id' => $sprint->id,
            'x' => 450, 'y' => 100,
        ]);

        $taskTraceboard = $createTask([
            'title' => 'Traceboard Node Graph',
            'description' => 'Build the node-graph task view with connections and spatial notes/pins.',
            'column_id' => $todo->id,
            'sprint_id' => $sprint->id,
            'x' => 450, 'y' => 300,
        ]);

        $taskSprints = $createTask([
            'title' => 'Sprint Management UI',
            'description' => 'Create sprint planning page with attach/detach tasks, sprint status, and goals.',
            'column_id' => $todo->id,
            'sprint_id' => $sprint->id,
            'x' => 450, 'y' => 500,
        ]);

        // --- Tasks In Progress ---
        $taskChat = $createTask([
            'title' => 'Real-time Team Chat',
            'description' => 'Real-time messaging using WebSockets via Laravel Reverb and Echo.',
            'column_id' => $inProgress->id,
            'sprint_id' => $sprintTwo->id,
            'status' => 'in-progress',
            'x' => 800, 'y' => 100,
        ]);

        $taskCursors = $createTask([
            'title' => 'Live Cursor Syncing',
            'description' => 'Broadcast mouse positions in real-time to all presence channel subscribers.',
            'column_id' => $inProgress->id,
            'sprint_id' => $sprintTwo->id,
            'status' => 'in-progress',
            'x' => 800, 'y' => 300,
        ]);

        $taskNotifications = $createTask([
            'title' => 'In-app Notifications',
            'description' => 'Push notifications for task assignments and mentions in chat.',
            'column_id' => $inProgress->id,
            'sprint_id' => $sprintTwo->id,
            'status' => 'in-progress',
            'x' => 800, 'y' => 500,
        ]);

        // --- Tasks Done ---
        $taskRepo = $createTask([
            'title' => 'CI/CD Pipeline',
            'description' => 'Laravel + Inertia stack wired up with Pest, Pint, and GitHub Actions.',
            'column_id' => $done->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'x' => 1150, 'y' => 100,
        ]);

        $taskDB = $createTask([
            'title' => 'PostgreSQL Schema',
            'description' => 'All core tables migrated: users, projects, tasks, columns, sprints.',
            'column_id' => $done->id,
            'sprint_id' => $sprint->id,
            'status' => 'done',
            'x' => 1150, 'y' => 300,
        ]);

        // --- Assign users ---
        $taskKanban->users()->attach([$testUser->id, $alice->id]);
        $taskTraceboard->users()->attach([$testUser->id, $bob->id]);
        $taskChat->users()->attach([$alice->id, $bob->id, $charlie->id]);
        $taskCursors->users()->attach([$testUser->id, $diana->id]);
        $taskNotifications->users()->attach([$diana->id]);
        $taskRepo->users()->attach([$testUser->id]);
        $taskDB->users()->attach([$testUser->id, $bob->id]);

        // --- Tags ---
        $taskKanban->tags()->attach([$tagFeature->id, $tagDesign->id]);
        $taskTraceboard->tags()->attach([$tagFeature->id]);
        $taskChat->tags()->attach([$tagFeature->id, $tagUrgent->id]);
        $taskAuth->tags()->attach([$tagRefactor->id, $tagUrgent->id]);
        $taskDB->tags()->attach([$tagRefactor->id]);

        // --- Task Connections (dependencies) ---
        // Using IDs explicitly to avoid any potential nulls
        $taskDB->targets()->attach($taskAuth->id);
        $taskRepo->targets()->attach($taskAuth->id);
        $taskAuth->targets()->attach($taskKanban->id);
        $taskAuth->targets()->attach($taskTraceboard->id);
        $taskKanban->targets()->attach($taskSprints->id);
        $taskTraceboard->targets()->attach($taskChat->id);
        $taskTraceboard->targets()->attach($taskCursors->id);
        $taskChat->targets()->attach($taskNotifications->id);

        // --- Subtasks ---
        Subtask::create(['id' => Str::uuid(), 'title' => 'Wire up DnD library', 'completed' => true, 'position' => 0, 'task_id' => $taskKanban->id]);
        Subtask::create(['id' => Str::uuid(), 'title' => 'Column reordering API', 'completed' => true, 'position' => 1, 'task_id' => $taskKanban->id]);
        Subtask::create(['id' => Str::uuid(), 'title' => 'Touch support for mobile', 'completed' => false, 'position' => 2, 'task_id' => $taskKanban->id]);

        Subtask::create(['id' => Str::uuid(), 'title' => 'React Flow node rendering', 'completed' => true, 'position' => 0, 'task_id' => $taskTraceboard->id]);
        Subtask::create(['id' => Str::uuid(), 'title' => 'Edge handle performance', 'completed' => false, 'position' => 1, 'task_id' => $taskTraceboard->id]);

        Subtask::create(['id' => Str::uuid(), 'title' => 'Reverb channel setup', 'completed' => true, 'position' => 0, 'task_id' => $taskChat->id]);
        Subtask::create(['id' => Str::uuid(), 'title' => 'Message broadcast events', 'completed' => true, 'position' => 1, 'task_id' => $taskChat->id]);
        Subtask::create(['id' => Str::uuid(), 'title' => 'Markdown support in messages', 'completed' => false, 'position' => 2, 'task_id' => $taskChat->id]);

        // --- Notes & Pins ---
        Note::create(['id' => Str::uuid(), 'text' => '🗒️ Weekly sync at 10 AM PST.', 'x' => 250, 'y' => 600, 'project_id' => $project->id]);
        Note::create(['id' => Str::uuid(), 'text' => '🚀 Aim to ship beta by EOM.', 'x' => 900, 'y' => 600, 'project_id' => $project->id]);

        Pin::create(['id' => Str::uuid(), 'title' => 'Figma UI Mockups', 'url' => 'https://figma.com', 'text' => 'Check the new dark mode exploration.', 'position' => 1, 'project_id' => $project->id]);
        Pin::create(['id' => Str::uuid(), 'title' => 'Architecture RFC', 'url' => 'https://example.com/rfc', 'text' => 'Discussing Reverb vs Pusher.', 'position' => 2, 'project_id' => $project->id]);
    }
}
