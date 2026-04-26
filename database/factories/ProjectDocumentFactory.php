<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectDocument>
 */
class ProjectDocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'title' => fake()->words(3, true),
            'markdown' => '# '.fake()->sentence(3)."\n\n".fake()->paragraph(),
            'version' => 1,
            'last_edited_by' => null,
        ];
    }
}
