<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::where('email', 'test@example.com')->first();
        $demoProject = Project::where('title', 'Meira Demo Project')->first();

        ProjectTemplate::create([
            'name' => 'Agile Sprint Template',
            'user_id' => $testUser->id,
            'project_id' => $demoProject->id,
            'data' => [
                'columns' => [
                    ['id' => 'col-1', 'name' => 'Backlog', 'position' => 1, 'type' => 'backlog'],
                    ['id' => 'col-2', 'name' => 'To Do', 'position' => 2, 'type' => 'to_do'],
                    ['id' => 'col-3', 'name' => 'In Progress', 'position' => 3, 'type' => 'in_progress'],
                    ['id' => 'col-4', 'name' => 'Done', 'position' => 4, 'type' => 'done'],
                ],
                'tasks' => [
                    [
                        'id' => 'tpl-task-1',
                        'title' => 'Define sprint goal',
                        'description' => 'Align the team on what success looks like for this sprint.',
                        'image' => null,
                        'position' => 1,
                        'x' => 100,
                        'y' => 100,
                        'column_id' => 'col-1',
                        'status' => 'open',
                        'subtasks' => [
                            ['id' => 1, 'title' => 'Collect stakeholder input', 'completed' => false, 'position' => 1],
                            ['id' => 2, 'title' => 'Write goal statement', 'completed' => false, 'position' => 2],
                        ],
                        'assigned_users' => [],
                    ],
                    [
                        'id' => 'tpl-task-2',
                        'title' => 'Set up project board',
                        'description' => 'Create and configure the Kanban or Traceboard for the team.',
                        'image' => null,
                        'position' => 2,
                        'x' => 400,
                        'y' => 100,
                        'column_id' => 'col-2',
                        'status' => 'open',
                        'subtasks' => [
                            ['id' => 3, 'title' => 'Create columns', 'completed' => false, 'position' => 1],
                            ['id' => 4, 'title' => 'Invite team members', 'completed' => false, 'position' => 2],
                        ],
                        'assigned_users' => [],
                    ],
                    [
                        'id' => 'tpl-task-3',
                        'title' => 'Sprint retrospective',
                        'description' => 'Review what went well, what could be improved.',
                        'image' => null,
                        'position' => 3,
                        'x' => 700,
                        'y' => 100,
                        'column_id' => 'col-1',
                        'status' => 'open',
                        'subtasks' => [],
                        'assigned_users' => [],
                    ],
                ],
                'task_connections' => [
                    ['id' => 1, 'source_id' => 'tpl-task-1', 'target_id' => 'tpl-task-2'],
                ],
                'pins' => [
                    ['id' => 1, 'title' => 'Sprint Docs', 'url' => 'https://example.com/sprint', 'text' => 'Sprint planning documentation', 'position' => 1],
                ],
                'notes' => [
                    ['id' => 'tpl-note-1', 'text' => '📋 Fill in the sprint goal before kickoff.', 'x' => 200, 'y' => 400],
                ],
                'project_users' => [],
            ],
        ]);
    }
}
