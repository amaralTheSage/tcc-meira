<?php

namespace App\Services\Projects;

use App\Enums\ColumnType;
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
            $taskIdMap = $this->cloneTasks($template, $project);

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
        $this->cloneColumns($template, $project);

        return $project;
    }

    private function copyTitle(ProjectTemplate $template): string
    {
        return (strstr($template->name, ' ') ?: $template->name).' Copy';
    }

    private function cloneColumns(ProjectTemplate $template, Project $project): void
    {
        foreach ($template->data['columns'] as $columnPayload) {
            Column::create($this->columnAttributes($columnPayload, $project));
        }
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
    private function cloneTasks(ProjectTemplate $template, Project $project): array
    {
        $taskIdMap = [];

        foreach ($template->data['tasks'] as $taskPayload) {
            $taskIdMap[$taskPayload['id']] = $this->cloneTask($project, $taskPayload);
        }

        return $taskIdMap;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     */
    private function cloneTask(Project $project, array $taskPayload): string
    {
        $newId = (string) Str::uuid7();
        $task = $project->tasks()->create($this->taskAttributes($project, $taskPayload, $newId));

        foreach ($taskPayload['subtasks'] ?? [] as $subtaskPayload) {
            $task->subtasks()->create($this->subtaskAttributes($subtaskPayload));
        }

        return $newId;
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     * @return array<string, scalar|null>
     */
    private function taskAttributes(Project $project, array $taskPayload, string $newId): array
    {
        return [
            'id' => $newId,
            'title' => $taskPayload['title'],
            'image' => $taskPayload['image'] ?? null,
            'description' => $taskPayload['description'] ?? null,
            'x' => $taskPayload['x'],
            'y' => $taskPayload['y'],
            'position' => $taskPayload['position'] ?? 0,
            'column_id' => $this->taskColumnId($project, $taskPayload),
            'project_id' => $project->id,
        ];
    }

    /**
     * @param  array<string, scalar|null|array<int, array<string, scalar|null>>>  $taskPayload
     */
    private function taskColumnId(Project $project, array $taskPayload): int|string|null
    {
        if (isset($taskPayload['column_id'])) {
            return $taskPayload['column_id'];
        }

        return Column::where('project_id', $project->id)
            ->where('type', ColumnType::BACKLOG->value)
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
            'image' => $subtaskPayload['image'] ?? null,
            'description' => $subtaskPayload['description'] ?? null,
            'position' => $subtaskPayload['position'] ?? 0,
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
