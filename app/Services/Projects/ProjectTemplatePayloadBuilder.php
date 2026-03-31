<?php

namespace App\Services\Projects;

use App\Models\Project;
use Illuminate\Support\Facades\DB;

class ProjectTemplatePayloadBuilder
{
    /**
     * Build the serializable template payload for a project.
     *
     * Example: $payload = $builder->build($project);
     *
     * @return array<string, array<int, array<string, scalar|null|array<int, array<string, scalar|null>>>|object>>
     */
    public function build(Project $project): array
    {
        return [
            'columns' => $this->columns($project),
            'tasks' => $this->tasks($project),
            'pins' => $this->pins($project),
            'notes' => $this->notes($project),
            'task_connections' => $this->taskConnections($project),
        ];
    }

    /**
     * @return array<int, array<string, scalar|null>>
     */
    private function columns(Project $project): array
    {
        return $project->columns()->orderBy('position')->get()->toArray();
    }

    /**
     * @return array<int, array<string, scalar|null|array<int, array<string, scalar|null>>>>
     */
    private function tasks(Project $project): array
    {
        return $project->tasks()->with('subtasks')->orderBy('position')->get()->toArray();
    }

    /**
     * @return array<int, array<string, scalar|null>>
     */
    private function pins(Project $project): array
    {
        return $project->pins()->orderBy('position')->get()->toArray();
    }

    /**
     * @return array<int, array<string, scalar|null>>
     */
    private function notes(Project $project): array
    {
        return $project->notes()->get()->toArray();
    }

    /**
     * @return array<int, object>
     */
    private function taskConnections(Project $project): array
    {
        return DB::table('task_connections')
            ->whereIn('source_id', $project->tasks->pluck('id'))
            ->get()
            ->toArray();
    }
}
