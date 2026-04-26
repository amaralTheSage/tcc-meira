<?php

namespace App\Services\Projects;

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Models\Column;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectTemplateApplier
{
    /**
     * Clone a project template into a new project owned by the user.
     *
     * Example: $project = $applier->apply($template, $user);
     */
    public function apply(ProjectTemplate $template, User $user): Project
    {
        return DB::transaction(function () use ($template, $user): Project {
            $project = $this->createProjectCopy($template, $user);
            $columnIdMap = $this->cloneColumns($template, $project);
            $taskIdMap = $this->cloneTasks($template, $project, $columnIdMap);

            $this->cloneTaskConnections($template, $taskIdMap);
            $this->cloneNotes($template, $project);
            $this->clonePins($template, $project);

            return $project;
        });
    }

    private function createProjectCopy(ProjectTemplate $template, User $user): Project
    {
        $project = Project::create(['title' => $this->copyTitle($template)]);
        $project->members()->attach($user);

        return $project;
    }

    private function copyTitle(ProjectTemplate $template): string
    {
        return (strstr($template->name, ' ') ?: $template->name).' Copy';
    }

    /**
     * @return array<string, int>
     */
    private function cloneColumns(ProjectTemplate $template, Project $project): array
    {
        $columnIdMap = [];

        foreach ($template->data['columns'] as $columnPayload) {
            $column = Column::create($this->columnAttributes($columnPayload, $project));

            if (isset($columnPayload['id'])) {
                $columnIdMap[(string) $columnPayload['id']] = $column->id;
            }
        }

        return $columnIdMap;
    }

    /**
     * @param  array{name: string, type: string, position: int}  $columnPayload
     * @return array{project_id: string, name: string, type: string, position: int}
     */
    private function columnAttributes(array $columnPayload, Project $project): array
    {
        return [
            'project_id' => $project->id,
            'name' => $columnPayload['name'],
            'type' => $columnPayload['type'],
            'position' => $columnPayload['position'],
        ];
    }

    /**
     * @return array<string, string>
     */
    private function cloneTasks(ProjectTemplate $template, Project $project, array $columnIdMap): array
    {
        $taskIdMap = [];
        $backlogColumnId = $this->clonedBacklogColumnId($template, $project, $columnIdMap);

        foreach ($template->data['tasks'] as $taskPayload) {
            $taskIdMap[$taskPayload['id']] = $this->cloneTask($project, $taskPayload, $columnIdMap, $backlogColumnId);
        }

        return $taskIdMap;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     * @param  array<string, int>  $columnIdMap
     */
    private function cloneTask(Project $project, array $taskPayload, array $columnIdMap, int|string|null $backlogColumnId): string
    {
        $newId = (string) Str::uuid7();
        $task = $project->tasks()->create($this->taskAttributes($project, $taskPayload, $newId, $columnIdMap, $backlogColumnId));

        foreach ($taskPayload['subtasks'] ?? [] as $subtaskPayload) {
            $task->subtasks()->create($this->subtaskAttributes($subtaskPayload));
        }

        return $newId;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     * @param  array<string, int>  $columnIdMap
     * @return array<string, scalar|null>
     */
    private function taskAttributes(Project $project, array $taskPayload, string $newId, array $columnIdMap, int|string|null $backlogColumnId): array
    {
        return [
            'id' => $newId,
            'title' => $taskPayload['title'],
            'image' => $taskPayload['image'] ?? null,
            'description' => $taskPayload['description'] ?? null,
            'x' => $taskPayload['x'],
            'y' => $taskPayload['y'],
            'position' => $taskPayload['position'] ?? 0,
            'status' => $taskPayload['status'] ?? Status::PENDING->value,
            'column_id' => $this->taskColumnId($taskPayload, $columnIdMap, $backlogColumnId),
            'project_id' => $project->id,
        ];
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     * @param  array<string, int>  $columnIdMap
     */
    private function taskColumnId(array $taskPayload, array $columnIdMap, int|string|null $backlogColumnId): int|string|null
    {
        if (isset($taskPayload['column_id'])) {
            return $columnIdMap[(string) $taskPayload['column_id']] ?? null;
        }

        return $backlogColumnId;
    }

    /**
     * @param  array<string, int>  $columnIdMap
     */
    private function clonedBacklogColumnId(ProjectTemplate $template, Project $project, array $columnIdMap): int|string|null
    {
        foreach ($template->data['columns'] as $columnPayload) {
            if ($this->isMappedBacklogColumn($columnPayload, $columnIdMap)) {
                return $columnIdMap[(string) $columnPayload['id']];
            }
        }

        return $this->latestBacklogColumnId($project);
    }

    /**
     * @param  array<string, scalar|null>  $columnPayload
     * @param  array<string, int>  $columnIdMap
     */
    private function isMappedBacklogColumn(array $columnPayload, array $columnIdMap): bool
    {
        return ($columnPayload['type'] ?? null) === ColumnType::BACKLOG->value
            && isset($columnPayload['id'])
            && isset($columnIdMap[(string) $columnPayload['id']]);
    }

    private function latestBacklogColumnId(Project $project): int|string|null
    {
        return Column::where('project_id', $project->id)
            ->where('type', ColumnType::BACKLOG->value)
            ->orderByDesc('id')
            ->value('id');
    }

    /**
     * @param  array<string, scalar|null>  $subtaskPayload
     * @return array<string, scalar|null>
     */
    private function subtaskAttributes(array $subtaskPayload): array
    {
        return [
            'title' => $subtaskPayload['title'],
            'position' => $subtaskPayload['position'] ?? 0,
            'completed' => $subtaskPayload['completed'] ?? false,
        ];
    }

    /**
     * @param  array<string, string>  $taskIdMap
     */
    private function cloneTaskConnections(ProjectTemplate $template, array $taskIdMap): void
    {
        foreach ($template->data['task_connections'] as $connectionPayload) {
            $this->insertConnection($connectionPayload, $taskIdMap);
        }
    }

    /**
     * @param  array{source_id: string, target_id: string}  $connectionPayload
     * @param  array<string, string>  $taskIdMap
     */
    private function insertConnection(array $connectionPayload, array $taskIdMap): void
    {
        $source = $taskIdMap[$connectionPayload['source_id']] ?? null;
        $target = $taskIdMap[$connectionPayload['target_id']] ?? null;

        if ($source && $target) {
            DB::table('task_connections')->insert(['source_id' => $source, 'target_id' => $target]);
        }
    }

    private function cloneNotes(ProjectTemplate $template, Project $project): void
    {
        foreach ($template->data['notes'] as $notePayload) {
            $project->notes()->create($this->noteAttributes($notePayload));
        }
    }

    /**
     * @param  array{text: string, x: int, y: int}  $notePayload
     * @return array{id: string, text: string, x: int, y: int}
     */
    private function noteAttributes(array $notePayload): array
    {
        return [
            'id' => Str::uuid7(),
            'text' => $notePayload['text'],
            'x' => $notePayload['x'],
            'y' => $notePayload['y'],
        ];
    }

    private function clonePins(ProjectTemplate $template, Project $project): void
    {
        foreach ($template->data['pins'] as $pinPayload) {
            $project->pins()->create($this->pinAttributes($pinPayload));
        }
    }

    /**
     * @param  array<string, scalar|null>  $pinPayload
     * @return array<string, scalar|null>
     */
    private function pinAttributes(array $pinPayload): array
    {
        return [
            'title' => $pinPayload['title'],
            'url' => $pinPayload['url'] ?? null,
            'text' => $pinPayload['text'] ?? null,
            'position' => $pinPayload['position'],
        ];
    }
}
