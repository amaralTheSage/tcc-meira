<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\Sprint;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sprint>
 */
class SprintFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => 'Sprint '.fake()->numberBetween(1, 100),
            'start_at' => now(),
            'end_at' => now()->addWeeks(2),
            'status' => 'planned',
            'goal' => fake()->sentence(),
            'color' => fake()->randomElement(['#2563eb', '#16a34a', '#dc2626', '#9333ea']),
            'project_id' => Project::factory(),
        ];
    }

    public function planned(): static
    {
        return $this->state(['status' => 'planned']);
    }

    public function active(): static
    {
        return $this->state(['status' => 'active']);
    }

    public function completed(): static
    {
        return $this->state(['status' => 'completed']);
    }
}
