<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
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
            'text' => fake()->paragraph(),
            'x' => fake()->numberBetween(0, 2000),
            'y' => fake()->numberBetween(0, 2000),
            'project_id' => Project::factory(),
        ];
    }
}
