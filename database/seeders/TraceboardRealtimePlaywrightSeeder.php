<?php

namespace Database\Seeders;

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Models\Column;
use App\Models\Note;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TraceboardRealtimePlaywrightSeeder extends Seeder
{
    public const PROJECT_ID = '019f0000-0000-7000-8000-000000000001';

    public const PROJECT_TITLE = 'Traceboard Realtime Playground';

    public const OWNER_EMAIL = 'traceboard-owner@meira.test';

    public const ALICE_EMAIL = 'traceboard-alice@meira.test';

    public const BOB_EMAIL = 'traceboard-bob@meira.test';

    private const TASK_PREFIX = 'traceboard-playwright-';

    /**
     * Seed a deterministic Traceboard playground for Playwright CLI sessions.
     *
     * Example: php artisan db:seed --class=TraceboardRealtimePlaywrightSeeder.
     */
    public function run(): void
    {
        $project = $this->seedProject();
        $members = $this->seedUsers();
        $this->attachMembers($project, $members);
        $this->seedTasks($project);
        $this->seedNotes($project);
        $this->seedConnections();
    }

    private function seedProject(): Project
    {
        return Project::unguarded(fn (): Project => Project::query()->updateOrCreate(
            ['id' => self::PROJECT_ID],
            ['animated_edges' => true, 'edge_type' => 'smoothstep', 'title' => self::PROJECT_TITLE],
        ));
    }

    /**
     * @return array<int, User>
     */
    private function seedUsers(): array
    {
        return array_map(fn (array $user): User => $this->seedUser($user), $this->userPayloads());
    }

    /**
     * @param  array{name: string, email: string, avatar: string}  $payload
     */
    private function seedUser(array $payload): User
    {
        return User::unguarded(fn (): User => User::query()->updateOrCreate(
            ['email' => $payload['email']],
            ['avatar' => $payload['avatar'], 'email_verified_at' => now(), 'name' => $payload['name'], 'workos_id' => 'seed-'.Str::slug($payload['email'])],
        ));
    }

    /**
     * @return array<int, array{name: string, email: string, avatar: string}>
     */
    private function userPayloads(): array
    {
        return [
            ['name' => 'Traceboard Owner', 'email' => self::OWNER_EMAIL, 'avatar' => $this->avatarUrl('Traceboard Owner', 'b91c1c')],
            ['name' => 'Traceboard Alice', 'email' => self::ALICE_EMAIL, 'avatar' => $this->avatarUrl('Traceboard Alice', '2563eb')],
            ['name' => 'Traceboard Bob', 'email' => self::BOB_EMAIL, 'avatar' => $this->avatarUrl('Traceboard Bob', '047857')],
        ];
    }

    /**
     * @param  array<int, User>  $members
     */
    private function attachMembers(Project $project, array $members): void
    {
        $project->members()->syncWithoutDetaching(collect($members)->pluck('id')->all());
    }

    private function seedTasks(Project $project): void
    {
        $column = $this->backlogColumn($project);
        $this->clearTaskConnections();

        foreach ($this->taskPayloads($project, $column) as $payload) {
            Task::query()->updateOrCreate(['id' => $payload['id']], $payload);
        }
    }

    private function backlogColumn(Project $project): Column
    {
        return $project->columns()->where('type', ColumnType::BACKLOG->value)->firstOrFail();
    }

    private function clearTaskConnections(): void
    {
        DB::table('task_connections')
            ->where('source_id', 'like', self::TASK_PREFIX.'%')
            ->orWhere('target_id', 'like', self::TASK_PREFIX.'%')
            ->delete();
    }

    /**
     * @return array<int, array<string, int|string|null>>
     */
    private function taskPayloads(Project $project, Column $column): array
    {
        return [
            $this->taskPayload('connect-source', 'Connect Source', 80, 100, Status::PENDING, $project, $column, 1),
            $this->taskPayload('connect-target', 'Connect Target', 440, 100, Status::PENDING, $project, $column, 2),
            $this->taskPayload('disconnect-source', 'Disconnect Source', 80, 340, Status::PENDING, $project, $column, 3),
            $this->taskPayload('disconnect-target', 'Disconnect Target', 440, 340, Status::PENDING, $project, $column, 4),
            $this->taskPayload('drag-lock', 'Drag Lock Target', 800, 100, Status::IN_PROGRESS, $project, $column, 5),
            $this->taskPayload('completed-target', 'Completed Target', 800, 340, Status::COMPLETED, $project, $column, 6),
        ];
    }

    /**
     * @return array<string, int|string|null>
     */
    private function taskPayload(string $slug, string $title, int $x, int $y, Status $status, Project $project, Column $column, int $position): array
    {
        return [
            'column_id' => $column->id,
            'description' => 'Seeded for Traceboard Playwright CLI realtime testing.',
            'id' => self::TASK_PREFIX.$slug,
            'position' => $position,
            'project_id' => $project->id,
            'sprint_id' => null,
            'status' => $status->value,
            'title' => $title,
            'x' => $x,
            'y' => $y,
        ];
    }

    private function seedNotes(Project $project): void
    {
        foreach ($this->notePayloads($project) as $payload) {
            Note::query()->updateOrCreate(['id' => $payload['id']], $payload);
        }
    }

    /**
     * @return array<int, array{id: string, text: string, x: int, y: int, project_id: string}>
     */
    private function notePayloads(Project $project): array
    {
        return [
            ['id' => self::TASK_PREFIX.'note-edit', 'text' => 'Edit me from Playwright', 'x' => 80, 'y' => 620, 'project_id' => $project->id],
            ['id' => self::TASK_PREFIX.'note-lock', 'text' => 'Remote lock note', 'x' => 440, 'y' => 620, 'project_id' => $project->id],
        ];
    }

    private function seedConnections(): void
    {
        DB::table('task_connections')->updateOrInsert(
            ['source_id' => self::TASK_PREFIX.'disconnect-source', 'target_id' => self::TASK_PREFIX.'disconnect-target'],
            ['created_at' => now(), 'updated_at' => now()],
        );
    }

    private function avatarUrl(string $name, string $background): string
    {
        return 'https://ui-avatars.com/api/?name='.urlencode($name).'&background='.$background.'&color=fff&size=512';
    }
}
