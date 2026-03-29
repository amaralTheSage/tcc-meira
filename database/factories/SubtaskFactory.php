<?php

namespace Database\Factories;

use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Subtask>
 */
class SubtaskFactory extends Factory
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
            'title' => fake()->sentence(3),
            'position' => fake()->numberBetween(0, 100),
            'completed' => fake()->boolean(),
            'task_id' => Task::factory(),
        ];
    }
}
