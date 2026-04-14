<?php

namespace Database\Factories;

use App\Models\Pin;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Pin>
 */
class PinFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => Str::uuid()->toString(),
            'text' => fake()->sentence(),
            'title' => fake()->word(),
            'url' => fake()->url(),
            'position' => fake()->numberBetween(1, 100),
            'project_id' => Project::factory(),
            'x' => fake()->numberBetween(0, 2000),
            'y' => fake()->numberBetween(0, 2000),
        ];
    }
}
