<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Project;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait GuardsProjectResources
{
    protected function ensureModelBelongsToProject(Project $project, Model $resource): void
    {
        $resourceProjectId = $resource->getAttribute('project_id');

        abort_unless((string) $resourceProjectId === (string) $project->id, 404);
    }

    protected function ensureTaskBelongsToProject(Project $project, Task $task): void
    {
        $this->ensureModelBelongsToProject($project, $task);
    }

    protected function ensureSubtaskBelongsToProject(Project $project, Subtask $subtask): void
    {
        abort_unless($subtask->task instanceof Task, 404);

        $this->ensureTaskBelongsToProject($project, $subtask->task);
    }

    protected function ensureUserBelongsToProject(Project $project, User $user): void
    {
        abort_unless($project->members()->whereKey($user->id)->exists(), 404);
    }

    /**
     * @param  array<int, array{id: int|string, position: int}>  $columnPayloads
     */
    protected function ensureColumnPayloadsBelongToProject(Project $project, array $columnPayloads): void
    {
        $columnIds = array_map(fn (array $column): int => (int) $column['id'], $columnPayloads);
        $expectedCount = count(array_unique($columnIds));
        $matchingCount = $project->columns()->whereIn('id', $columnIds)->count();

        abort_unless($matchingCount === $expectedCount, 404);
    }
}
