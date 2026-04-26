<?php

namespace Database\Factories;

use App\Models\ProjectDocument;
use App\Models\ProjectDocumentRevision;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectDocumentRevision>
 */
class ProjectDocumentRevisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_document_id' => ProjectDocument::factory(),
            'user_id' => null,
            'version' => 1,
            'markdown' => fake()->paragraph(),
        ];
    }
}
