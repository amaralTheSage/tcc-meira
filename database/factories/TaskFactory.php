<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'image' => null,
            'x' => fake()->numberBetween(50, 1200),
            'y' => fake()->numberBetween(50, 800),
            'position' => fake()->numberBetween(0, 100),
            'status' => fake()->randomElement(['open', 'in-progress', 'done']),
            'project_id' => Project::factory(),
            'column_id' => null,
            'sprint_id' => null,
        ];
    }
}
