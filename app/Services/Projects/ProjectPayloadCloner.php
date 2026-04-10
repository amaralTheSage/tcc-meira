<?php

namespace App\Services\Projects;

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Models\Column;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectPayloadCloner
{
    /**
     * Clone a serialized project payload into a private project for a user.
     *
     * Example: $project = $cloner->clone($payload, $user, 'Roadmap Copy').
     *
     * @param  array<string, array<int, array<string, scalar|null|array<int, array<string, scalar|null>>>|object>>  $payload
     */
    public function clone(array $payload, User $user, string $title): Project
    {
        return DB::transaction(function () use ($payload, $user, $title): Project {
            $project = $this->createProject($title, $user);
            $columnIdMap = $this->cloneColumns($payload['columns'] ?? [], $project);
            $taskIdMap = $this->cloneTasks($payload['tasks'] ?? [], $project, $columnIdMap);

            $this->cloneTaskConnections($payload['task_connections'] ?? [], $taskIdMap);
            $this->cloneNotes($payload['notes'] ?? [], $project);
            $this->clonePins($payload['pins'] ?? [], $project);
            $this->cloneDocuments($payload['documents'] ?? [], $project);

            return $project;
        });
    }

    private function createProject(string $title, User $user): Project
    {
        $project = Project::create(['title' => $title]);
        $project->members()->attach($user);

        return $project;
    }

    /**
     * @param  array<int, array<string, scalar|null>|object>  $columns
     * @return array<string, int>
     */
    private function cloneColumns(array $columns, Project $project): array
    {
        if ($columns === []) {
            return [];
        }

        $project->columns()->delete();

        return collect($columns)->mapWithKeys(fn (array|object $payload): array => $this->cloneColumn((array) $payload, $project))->all();
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array<string, int>
     */
    private function cloneColumn(array $payload, Project $project): array
    {
        $column = Column::create($this->columnAttributes($payload, $project));

        return isset($payload['id']) ? [(string) $payload['id'] => $column->id] : [];
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array{project_id: string, name: scalar|null, type: scalar|null, position: scalar|null}
     */
    private function columnAttributes(array $payload, Project $project): array
    {
        return [
            'project_id' => $project->id,
            'name' => $payload['name'] ?? null,
            'type' => $payload['type'] ?? ColumnType::STANDARD->value,
            'position' => $payload['position'] ?? 0,
        ];
    }

    /**
     * @param  array<int, array<string, scalar|null|array<int, array<string, scalar|null>>>|object>  $tasks
     * @param  array<string, int>  $columnIdMap
     * @return array<string, string>
     */
    private function cloneTasks(array $tasks, Project $project, array $columnIdMap): array
    {
        $taskIdMap = [];
        $backlogColumnId = $this->backlogColumnId($project);

        foreach ($tasks as $payload) {
            $taskPayload = (array) $payload;
            $sourceId = (string) ($taskPayload['id'] ?? Str::uuid7());
            $taskIdMap[$sourceId] = $this->cloneTask($project, $taskPayload, $columnIdMap, $backlogColumnId);
        }

        return $taskIdMap;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $payload
     * @param  array<string, int>  $columnIdMap
     */
    private function cloneTask(Project $project, array $payload, array $columnIdMap, int|string|null $backlogColumnId): string
    {
        $newId = (string) Str::uuid7();
        $task = $project->tasks()->create($this->taskAttributes($payload, $newId, $columnIdMap, $backlogColumnId));

        foreach ($payload['subtasks'] ?? [] as $subtask) {
            $task->subtasks()->create($this->subtaskAttributes((array) $subtask));
        }

        return $newId;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $payload
     * @param  array<string, int>  $columnIdMap
     * @return array<string, scalar|null>
     */
    private function taskAttributes(array $payload, string $newId, array $columnIdMap, int|string|null $backlogColumnId): array
    {
        return [
            'id' => $newId,
            'title' => $payload['title'] ?? null,
            'image' => $payload['image'] ?? null,
            'description' => $payload['description'] ?? null,
            'x' => $payload['x'] ?? 0,
            'y' => $payload['y'] ?? 0,
            'position' => $payload['position'] ?? 0,
            'status' => $payload['status'] ?? Status::PENDING->value,
            'column_id' => $this->taskColumnId($payload, $columnIdMap, $backlogColumnId),
        ];
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $payload
     * @param  array<string, int>  $columnIdMap
     */
    private function taskColumnId(array $payload, array $columnIdMap, int|string|null $backlogColumnId): int|string|null
    {
        if (! isset($payload['column_id'])) {
            return $backlogColumnId;
        }

        return $columnIdMap[(string) $payload['column_id']] ?? $backlogColumnId;
    }

    private function backlogColumnId(Project $project): int|string|null
    {
        return $project->columns()
            ->where('type', ColumnType::BACKLOG->value)
            ->orderBy('position')
            ->value('id');
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array<string, scalar|null>
     */
    private function subtaskAttributes(array $payload): array
    {
        return [
            'title' => $payload['title'] ?? null,
            'position' => $payload['position'] ?? 0,
            'completed' => $payload['completed'] ?? false,
        ];
    }

    /**
     * @param  array<int, array<string, scalar|null>|object>  $connections
     * @param  array<string, string>  $taskIdMap
     */
    private function cloneTaskConnections(array $connections, array $taskIdMap): void
    {
        foreach ($connections as $payload) {
            $this->insertConnection((array) $payload, $taskIdMap);
        }
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @param  array<string, string>  $taskIdMap
     */
    private function insertConnection(array $payload, array $taskIdMap): void
    {
        $source = $taskIdMap[(string) ($payload['source_id'] ?? '')] ?? null;
        $target = $taskIdMap[(string) ($payload['target_id'] ?? '')] ?? null;

        if ($source !== null && $target !== null) {
            DB::table('task_connections')->insert(['source_id' => $source, 'target_id' => $target]);
        }
    }

    /**
     * @param  array<int, array<string, scalar|null>|object>  $notes
     */
    private function cloneNotes(array $notes, Project $project): void
    {
        foreach ($notes as $payload) {
            $project->notes()->create($this->noteAttributes((array) $payload));
        }
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array<string, scalar|null>
     */
    private function noteAttributes(array $payload): array
    {
        return [
            'id' => (string) Str::uuid7(),
            'text' => $payload['text'] ?? null,
            'x' => $payload['x'] ?? 0,
            'y' => $payload['y'] ?? 0,
        ];
    }

    /**
     * @param  array<int, array<string, scalar|null>|object>  $pins
     */
    private function clonePins(array $pins, Project $project): void
    {
        foreach ($pins as $payload) {
            $project->pins()->create($this->pinAttributes((array) $payload));
        }
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array<string, scalar|null>
     */
    private function pinAttributes(array $payload): array
    {
        return [
            'id' => (string) Str::uuid7(),
            'title' => $payload['title'] ?? null,
            'url' => $payload['url'] ?? null,
            'text' => $payload['text'] ?? null,
            'position' => $payload['position'] ?? 0,
        ];
    }

    /**
     * @param  array<int, array<string, scalar|null>|object>  $documents
     */
    private function cloneDocuments(array $documents, Project $project): void
    {
        if ($documents === []) {
            return;
        }

        $project->documents()->delete();

        foreach ($documents as $payload) {
            $project->documents()->create($this->documentAttributes((array) $payload));
        }
    }

    /**
     * @param  array<string, scalar|null>  $payload
     * @return array<string, scalar|null>
     */
    private function documentAttributes(array $payload): array
    {
        return [
            'title' => $payload['title'] ?? 'Project Docs',
            'markdown' => $payload['markdown'] ?? '',
            'version' => 1,
            'last_edited_by' => null,
        ];
    }
}
