<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        Project::factory()->create([
            'title' => 'Projeto teste',
        ]);

        Task::factory()->create([
            'title' => 'Criar componentes Pias auh au hUAUHAUHA',
            'image' => '',
            'x' => '0',
            'y' => '0',
            'project_id' => '01975778-1900-73d3-932e-af0f2367beb6']);

    }
}
