<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            DemoProjectSeeder::class,
            ChatSeeder::class,
            TemplateSeeder::class,
            CommunityFeedSeeder::class,
            LegacyCommunityMockProjectSeeder::class,
            RandomProjectSeeder::class,
        ]);
    }
}
