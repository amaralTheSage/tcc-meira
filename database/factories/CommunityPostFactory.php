<?php

namespace Database\Factories;

use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CommunityPost>
 */
class CommunityPostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory()->state([
                'visibility' => ProjectVisibility::PUBLIC->value,
                'share_token' => Str::random(48),
                'published_at' => now(),
            ]),
            'title' => fake()->sentence(),
            'description' => fake()->paragraph(),
        ];
    }
}
