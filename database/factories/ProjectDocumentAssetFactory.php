<?php

namespace Database\Factories;

use App\Models\ProjectDocument;
use App\Models\ProjectDocumentAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectDocumentAsset>
 */
class ProjectDocumentAssetFactory extends Factory
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
            'uploaded_by' => null,
            'disk' => 'public',
            'path' => 'docs/example.png',
            'original_name' => 'example.png',
            'mime_type' => 'image/png',
            'size' => 1024,
        ];
    }
}
