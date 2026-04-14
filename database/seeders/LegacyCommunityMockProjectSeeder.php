<?php

namespace Database\Seeders;

use App\Enums\ColumnType;
use App\Enums\ProjectVisibility;
use App\Enums\Status;
use App\Models\Column;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectView;
use App\Models\Sprint;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use RuntimeException;

class LegacyCommunityMockProjectSeeder extends Seeder
{
    private const LEGACY_PROJECTS = [
        [
            'title' => '5ª SAJIC',
            'share_token' => 'legacy-sajic-2025',
            'visibility' => 'public',
            'owner_email' => 'test@example.com',
            'member_emails' => ['test@example.com', 'alice@example.com', 'charlie@example.com', 'diana@example.com'],
            'image' => 'https://picsum.photos/600/400?random=1',
            'views' => 64,
            'days_ago' => 1,
            'goal' => 'Launch the full 2025 event platform with check-ins, sessions, rooms, and certificates.',
            'description' => 'Dando continuidade ao trabalho iniciado em 2024, colaborei com colegas no desenvolvimento da nova plataforma da SAJIC 2025, com o objetivo de expandir significativamente as funcionalidades do site anterior e solucionar limitações críticas observadas na última edição.',
        ],
        [
            'title' => '4ª SAJIC',
            'share_token' => 'legacy-sajic-2024',
            'visibility' => 'public',
            'owner_email' => 'alice@example.com',
            'member_emails' => ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
            'image' => 'https://picsum.photos/600/400?random=2',
            'views' => 38,
            'days_ago' => 2,
            'goal' => 'Document the previous academic event platform and preserve the lessons learned.',
            'description' => 'Projeto colaborativo da edição anterior do evento, focado em inovação tecnológica e acadêmica.',
        ],
        [
            'title' => 'Coisa Imóveis',
            'share_token' => 'legacy-coisa-imoveis',
            'visibility' => 'public',
            'owner_email' => 'bob@example.com',
            'member_emails' => ['bob@example.com', 'diana@example.com'],
            'image' => 'https://picsum.photos/600/400?random=3',
            'views' => 51,
            'days_ago' => 3,
            'goal' => 'Prototype real-estate listing flows for browsing, filtering, and saving homes.',
            'description' => 'Plataforma de busca de imóveis criada para simular listagens de casas e apartamentos.',
        ],
        [
            'title' => 'MEIRA',
            'share_token' => 'legacy-meira',
            'visibility' => 'public',
            'owner_email' => 'test@example.com',
            'member_emails' => ['test@example.com', 'alice@example.com', 'bob@example.com', 'diana@example.com'],
            'image' => 'https://picsum.photos/600/400?random=4',
            'views' => 89,
            'days_ago' => 4,
            'goal' => 'Coordinate the public-sharing rollout for project boards, exports, and copies.',
            'description' => 'Ferramenta de gerenciamento de projetos simplificada para equipes acadêmicas e startups.',
        ],
        [
            'title' => 'Portfólio Acadêmico',
            'share_token' => 'legacy-portfolio-academico',
            'visibility' => 'public',
            'owner_email' => 'charlie@example.com',
            'member_emails' => ['charlie@example.com', 'alice@example.com'],
            'image' => 'https://picsum.photos/600/400?random=5',
            'views' => 27,
            'days_ago' => 5,
            'goal' => 'Publish a structured portfolio of academic collaborations completed in 2025.',
            'description' => 'Aplicação criada para exibir projetos e colaborações realizados em 2025.',
        ],
        [
            'title' => 'Demo Imobiliária',
            'share_token' => 'legacy-demo-imobiliaria',
            'visibility' => 'link_only',
            'owner_email' => 'diana@example.com',
            'member_emails' => ['diana@example.com', 'bob@example.com'],
            'image' => 'https://picsum.photos/600/400?random=6',
            'views' => 12,
            'days_ago' => 6,
            'goal' => 'Keep a hidden-link real estate demo available for share-page testing.',
            'description' => 'Exemplo de listagem de propriedades com interface intuitiva e responsiva.',
        ],
    ];

    /**
     * Recreate the old community mock cards as real shared projects.
     *
     * Example: php artisan db:seed --class=LegacyCommunityMockProjectSeeder.
     */
    public function run(): void
    {
        foreach (self::LEGACY_PROJECTS as $index => $seed) {
            $this->seedLegacyProject($seed, $index);
        }
    }

    /**
     * @param  array{title: string, share_token: string, visibility: string, owner_email: string, member_emails: list<string>, image: string, views: int, days_ago: int, goal: string, description: string}  $seed
     */
    private function seedLegacyProject(array $seed, int $index): void
    {
        $project = $this->upsertSharedProject($seed);
        $owner = $this->requiredSeedUser($seed['owner_email']);
        $members = $this->seedMembers($seed['member_emails']);

        $project->members()->sync($members->pluck('id')->all());
        $this->refreshProjectWorkspace($project);
        $tags = $this->createTags($project);
        $sprint = $this->createSprint($project, $seed, $index);
        $tasks = $this->createProjectTasks($project, $seed, $members, $tags, $sprint);
        $this->connectTasks($tasks);
        $this->createNotes($project, $seed);
        $this->createPins($project, $seed);
        $this->createDocument($project, $seed, $owner);
        $this->upsertCommunityPost($project, $seed, $members);
        $this->seedViews($project, $seed['views']);
    }

    /**
     * @param  array{title: string, share_token: string, visibility: string, days_ago: int}  $seed
     */
    private function upsertSharedProject(array $seed): Project
    {
        return Project::updateOrCreate(['share_token' => $seed['share_token']], [
            'title' => $seed['title'],
            'edge_type' => 'bezier',
            'animated_edges' => true,
            'visibility' => ProjectVisibility::from($seed['visibility']),
            'published_at' => now()->subDays($seed['days_ago']),
        ]);
    }

    /**
     * @param  list<string>  $emails
     * @return Collection<int, User>
     */
    private function seedMembers(array $emails): Collection
    {
        return collect($emails)
            ->map(fn (string $email): User => $this->requiredSeedUser($email))
            ->values();
    }

    private function refreshProjectWorkspace(Project $project): void
    {
        $project->tasks()->delete();
        $project->tags()->delete();
        $project->sprints()->delete();
        $project->notes()->delete();
        $project->pins()->delete();
        $project->documents()->delete();
        $project->views()->delete();
    }

    /**
     * @return Collection<string, Tag>
     */
    private function createTags(Project $project): Collection
    {
        return collect([
            ['name' => 'Planning', 'color' => '#6366f1'],
            ['name' => 'Build', 'color' => '#0ea5e9'],
            ['name' => 'Launch', 'color' => '#22c55e'],
        ])->mapWithKeys(fn (array $tag): array => [$tag['name'] => Tag::create([
            'id' => (string) Str::uuid(),
            'project_id' => $project->id,
            'name' => $tag['name'],
            'color' => $tag['color'],
        ])]);
    }

    /**
     * @param  array{title: string, goal: string, days_ago: int}  $seed
     */
    private function createSprint(Project $project, array $seed, int $index): Sprint
    {
        return Sprint::create([
            'title' => $seed['title'].' Launch Sprint',
            'project_id' => $project->id,
            'start_at' => now()->subDays($seed['days_ago'] + 7),
            'end_at' => now()->addDays(7 + $index),
            'status' => $index === 0 ? 'active' : 'planned',
            'goal' => $seed['goal'],
        ]);
    }

    /**
     * @param  array{title: string, goal: string}  $seed
     * @param  Collection<int, User>  $members
     * @param  Collection<string, Tag>  $tags
     * @return Collection<int, Task>
     */
    private function createProjectTasks(Project $project, array $seed, Collection $members, Collection $tags, Sprint $sprint): Collection
    {
        $columns = $this->columnsByType($project);
        $taskSeeds = $this->taskSeeds($seed, $columns, $sprint);
        $tasks = collect($taskSeeds)->map(fn (array $taskSeed): Task => $this->createTask($project, $taskSeed));

        $this->attachTaskMetadata($tasks, $members, $tags);

        return $tasks->values();
    }

    /**
     * @return Collection<string, Column>
     */
    private function columnsByType(Project $project): Collection
    {
        $columns = $project->columns()->orderBy('position')->get()->keyBy('type');

        foreach (ColumnType::cases() as $type) {
            if ($type === ColumnType::STANDARD || $columns->get($type->value) instanceof Column) {
                continue;
            }

            throw new RuntimeException("Project [{$project->id}] is missing column [{$type->value}], expected default project columns.");
        }

        return $columns;
    }

    /**
     * @param  array{title: string, goal: string}  $seed
     * @param  Collection<string, Column>  $columns
     * @return list<array{id: string, title: string, description: string, column_id: int, sprint_id: string, status: string, position: int, x: int, y: int}>
     */
    private function taskSeeds(array $seed, Collection $columns, Sprint $sprint): array
    {
        return [
            $this->taskSeed($seed, $columns, $sprint, 'research', ColumnType::BACKLOG, Status::PENDING, 0, 120, 120),
            $this->taskSeed($seed, $columns, $sprint, 'prototype', ColumnType::TODO, Status::PENDING, 1, 440, 220),
            $this->taskSeed($seed, $columns, $sprint, 'review', ColumnType::IN_PROGRESS, Status::IN_PROGRESS, 2, 760, 320),
            $this->taskSeed($seed, $columns, $sprint, 'launch', ColumnType::DONE, Status::COMPLETED, 3, 1080, 420),
        ];
    }

    /**
     * @param  array{title: string, goal: string}  $seed
     * @return array{id: string, title: string, description: string, column_id: int, sprint_id: string, status: string, position: int, x: int, y: int}
     */
    private function taskSeed(array $seed, Collection $columns, Sprint $sprint, string $slug, ColumnType $type, Status $status, int $position, int $x, int $y): array
    {
        $column = $this->requiredColumn($columns, $type);

        return [
            'id' => $this->taskId($seed['title'], $slug),
            'title' => $this->taskTitle($seed['title'], $slug),
            'description' => $seed['goal'],
            'column_id' => $column->id,
            'sprint_id' => $sprint->id,
            'status' => $status->value,
            'position' => $position,
            'x' => $x,
            'y' => $y,
        ];
    }

    private function createTask(Project $project, array $seed): Task
    {
        return Task::create(array_merge($seed, [
            'project_id' => $project->id,
            'image' => null,
        ]));
    }

    private function taskId(string $title, string $slug): string
    {
        return 'legacy-'.Str::slug($title).'-'.$slug;
    }

    private function taskTitle(string $title, string $slug): string
    {
        return match ($slug) {
            'research' => 'Map '.$title.' requirements',
            'prototype' => 'Build '.$title.' prototype flow',
            'review' => 'Review '.$title.' release assets',
            default => 'Publish '.$title.' shared demo',
        };
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @param  Collection<int, User>  $members
     * @param  Collection<string, Tag>  $tags
     */
    private function attachTaskMetadata(Collection $tasks, Collection $members, Collection $tags): void
    {
        $memberIds = $members->pluck('id')->all();

        $tasks->each(fn (Task $task): array => $task->users()->sync($memberIds));
        $tasks->get(0)?->tags()->sync([$this->requiredTag($tags, 'Planning')->id]);
        $tasks->get(1)?->tags()->sync([$this->requiredTag($tags, 'Build')->id]);
        $tasks->get(2)?->tags()->sync([$this->requiredTag($tags, 'Build')->id]);
        $tasks->get(3)?->tags()->sync([$this->requiredTag($tags, 'Launch')->id]);
    }

    /**
     * @param  Collection<int, Task>  $tasks
     */
    private function connectTasks(Collection $tasks): void
    {
        $first = $this->requiredTask($tasks, 0);
        $second = $this->requiredTask($tasks, 1);
        $third = $this->requiredTask($tasks, 2);
        $fourth = $this->requiredTask($tasks, 3);

        $first->targets()->attach($second->id);
        $second->targets()->attach($third->id);
        $third->targets()->attach($fourth->id);
    }

    /**
     * @param  array{title: string, goal: string}  $seed
     */
    private function createNotes(Project $project, array $seed): void
    {
        $project->notes()->create(['id' => (string) Str::uuid(), 'text' => $seed['goal'], 'x' => 260, 'y' => 560]);
        $project->notes()->create(['id' => (string) Str::uuid(), 'text' => 'Shared read-only demo for '.$seed['title'].'.', 'x' => 860, 'y' => 620]);
    }

    /**
     * @param  array{title: string}  $seed
     */
    private function createPins(Project $project, array $seed): void
    {
        $project->pins()->create(['id' => (string) Str::uuid(), 'title' => $seed['title'].' Brief', 'url' => 'https://example.com/'.$project->share_token, 'position' => 1, 'x' => 180, 'y' => 180]);
        $project->pins()->create(['id' => (string) Str::uuid(), 'title' => 'Testing checklist', 'text' => 'Open, export, and copy the shared project.', 'position' => 2, 'x' => 520, 'y' => 260]);
    }

    /**
     * @param  array{title: string, description: string, goal: string}  $seed
     */
    private function createDocument(Project $project, array $seed, User $owner): void
    {
        $project->documents()->create([
            'title' => $seed['title'].' Brief',
            'markdown' => "# {$seed['title']} Brief\n\n{$seed['description']}\n\n## Goal\n\n{$seed['goal']}\n\n## Test Focus\n\n- Open the shared page.\n- Export the project.\n- Copy it into a private workspace.",
            'version' => 2,
            'last_edited_by' => $owner->id,
        ]);
    }

    /**
     * @param  array{title: string, description: string, image: string}  $seed
     * @param  Collection<int, User>  $members
     */
    private function upsertCommunityPost(Project $project, array $seed, Collection $members): void
    {
        $post = CommunityPost::updateOrCreate(['project_id' => $project->id], [
            'title' => $seed['title'],
            'description' => $seed['description'],
        ]);

        $post->members()->sync($members->pluck('id')->all());
        $post->images()->delete();
        $post->images()->create(['image_id' => $seed['image']]);
    }

    private function seedViews(Project $project, int $views): void
    {
        for ($index = 0; $index < $views; $index++) {
            ProjectView::create([
                'project_id' => $project->id,
                'visitor_hash' => hash('sha256', $project->share_token.'|legacy-view-'.$index),
                'viewed_on' => now()->subDays($index % 14)->toDateString(),
            ]);
        }

        $project->forceFill(['public_views_count' => $views])->save();
    }

    private function requiredSeedUser(string $email): User
    {
        $user = User::where('email', $email)->first();

        if ($user instanceof User) {
            return $user;
        }

        throw new RuntimeException("Missing seeded user [{$email}], expected UserSeeder to run first.");
    }

    /**
     * @param  Collection<string, Column>  $columns
     */
    private function requiredColumn(Collection $columns, ColumnType $type): Column
    {
        $column = $columns->get($type->value);

        if ($column instanceof Column) {
            return $column;
        }

        throw new RuntimeException("Missing column [{$type->value}], expected default project column.");
    }

    /**
     * @param  Collection<string, Tag>  $tags
     */
    private function requiredTag(Collection $tags, string $name): Tag
    {
        $tag = $tags->get($name);

        if ($tag instanceof Tag) {
            return $tag;
        }

        throw new RuntimeException("Missing tag [{$name}], expected seeded project tags.");
    }

    /**
     * @param  Collection<int, Task>  $tasks
     */
    private function requiredTask(Collection $tasks, int $index): Task
    {
        $task = $tasks->get($index);

        if ($task instanceof Task) {
            return $task;
        }

        throw new RuntimeException("Missing task index [{$index}], expected four seeded tasks.");
    }
}
