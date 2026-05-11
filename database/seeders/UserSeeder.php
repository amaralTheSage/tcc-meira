<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUser = User::factory()->create([
            'name' => 'Meira Test User',
            'email' => 'test@example.com',
            'avatar' => 'https://ui-avatars.com/api/?name=Meira+Test+User&background=6366f1&color=fff&size=512',
        ]);

        $alice = User::factory()->create([
            'name' => 'Alice Worker',
            'email' => 'alice@example.com',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice&backgroundColor=b6e3f4',
        ]);

        $bob = User::factory()->create([
            'name' => 'Bob Builder',
            'email' => 'bob@example.com',
            'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob&backgroundColor=ffdfbf',
        ]);

        // Create some more team members
        $extraUsers = [
            ['name' => 'Charlie Designer', 'email' => 'charlie@example.com', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=d1d4f9'],
            ['name' => 'Diana Lead', 'email' => 'diana@example.com', 'avatar' => 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana&backgroundColor=ffd5dc'],
        ];

        foreach ($extraUsers as $u) {
            User::factory()->create($u);
        }

        User::factory(3)->create([
            'avatar' => fn ($attr) => 'https://ui-avatars.com/api/?name='.urlencode($attr['name']).'&background=random',
        ]);

    }
}
