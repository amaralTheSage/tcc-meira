<?php

namespace Database\Seeders;

use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RandomProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        if ($users->isEmpty()) {
            $users = User::factory(10)->create();
        }

        // Create 3 random projects
        Project::factory(3)->create()->each(function ($project) use ($users) {
            // Attach random members
            $members = $users->random(rand(2, 5));
            $project->members()->attach($members->pluck('id'));

            // The Project::boot() already created 4 columns and a chat.
            $columns = $project->columns;

            // Create 2-3 Sprints
            $sprints = Sprint::factory(rand(2, 3))->create(['project_id' => $project->id]);

            // Create some tags
            $tags = Tag::factory(5)->create(['project_id' => $project->id]);

            // Create 10-15 random tasks
            foreach (range(1, rand(10, 15)) as $index) {
                $column = $columns->random();
                $sprint = rand(0, 1) ? $sprints->random() : null;

                $task = Task::factory()->create([
                    'project_id' => $project->id,
                    'column_id' => $column->id,
                    'sprint_id' => $sprint?->id,
                    'x' => rand(0, 2000),
                    'y' => rand(0, 2000),
                    'position' => $index,
                ]);

                // Attach random users from members
                $task->users()->attach($members->random(rand(1, 2))->pluck('id'));

                // Attach random tags
                $task->tags()->attach($tags->random(rand(1, 2))->pluck('id'));
            }

            // Create some random notes
            Note::factory(rand(3, 6))->create([
                'project_id' => $project->id,
                'x' => rand(0, 2000),
                'y' => rand(0, 2000),
            ]);

            // Create some random pins
            Pin::create([
                'id' => Str::uuid(),
                'project_id' => $project->id,
                'title' => fake()->sentence(3),
                'url' => fake()->url(),
                'text' => fake()->paragraph(),
                'position' => 1,
                'x' => rand(0, 2000),
                'y' => rand(0, 2000),
            ]);
        });
    }
}
