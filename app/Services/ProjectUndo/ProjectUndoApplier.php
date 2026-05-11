<?php

namespace App\Services\ProjectUndo;

use App\Enums\ProjectUndoActionType;
use App\Events\ProjectBoardRefreshed;
use App\Models\Column;
use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\ProjectUndoAction;
use App\Models\Subtask;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectUndoApplier
{
    public function __construct(
        private ProjectUndoRecorder $recorder,
        private ProjectBoardSnapshotter $snapshots,
        private ProjectBoardSnapshotRestorer $restorer,
    ) {}

    /**
     * Undo the current user's latest project action.
     *
     * Example: $applier->undoLatest($project, $user).
     */
    public function undoLatest(Project $project, User $user): ProjectUndoResult
    {
        $latest = $this->recorder->latest($project, $user);
        if ($latest === null) {
            return ProjectUndoResult::empty();
        }

        return $this->applyLockedAction($latest, $project, $user);
    }

    private function applyLockedAction(ProjectUndoAction $action, Project $project, User $user): ProjectUndoResult
    {
        try {
            $label = DB::transaction(fn (): string => $this->applyInsideTransaction($action));
        } catch (ProjectUndoConflict $conflict) {
            return ProjectUndoResult::conflict($conflict->getMessage());
        }

        broadcast(new ProjectBoardRefreshed((string) $project->id, $user->id))->toOthers();

        return ProjectUndoResult::undone($label);
    }

    private function applyInsideTransaction(ProjectUndoAction $action): string
    {
        $locked = ProjectUndoAction::query()->whereKey($action->id)->lockForUpdate()->firstOrFail();
        if ($locked->undone_at !== null) {
            throw ProjectUndoConflict::relationChanged('undo action', (string) $locked->id);
        }

        $this->applyAction($locked);
        $locked->update(['undone_at' => now()]);

        return $locked->action_label;
    }

    private function applyAction(ProjectUndoAction $action): void
    {
        $type = $action->action_type;

        if ($this->isCreateType($type)) {
            $this->undoCreate($action->undo_payload);
        } elseif ($this->isUpdateType($type)) {
            $this->undoUpdate($action->undo_payload);
        } elseif ($this->isDeleteType($type)) {
            $this->undoDelete($action->undo_payload);
        } elseif ($this->isReorderType($type)) {
            $this->undoReorder($action->undo_payload);
        } else {
            $this->undoRelation($action->undo_payload);
        }
    }

    private function undoCreate(array $payload): void
    {
        $resource = (string) $payload['resource'];
        $id = $this->snapshotId($payload['after']);
        $this->assertCurrentSnapshot($resource, $id, $payload['after']);
        $this->deleteResource($resource, $id);
    }

    private function undoUpdate(array $payload): void
    {
        $resource = (string) $payload['resource'];
        $id = $this->snapshotId($payload['after']);
        $this->assertCurrentSnapshot($resource, $id, $payload['after']);
        $this->restoreExistingResource($resource, $payload['before']);
    }

    private function undoDelete(array $payload): void
    {
        $resource = (string) $payload['resource'];
        $id = $this->snapshotId($payload['before']);

        if ($this->currentSnapshot($resource, $id) !== null) {
            throw ProjectUndoConflict::existingResource($resource, $id);
        }

        $this->restoreMissingResource($resource, $payload['before']);
    }

    private function undoReorder(array $payload): void
    {
        $resource = (string) $payload['resource'];
        $ids = collect($payload['after'])->pluck('id')->all();
        $current = $this->currentOrderState($resource, $payload['project_id'] ?? null, $ids);

        if ($current != $payload['after']) {
            throw ProjectUndoConflict::snapshotChanged($resource, implode(',', $ids));
        }

        $this->restoreOrder($resource, $payload['before']);
    }

    private function undoRelation(array $payload): void
    {
        $count = $this->relationCount($payload['relation'], $payload['keys']);
        $expectedCount = (bool) $payload['after_exists'] ? 1 : 0;

        if ($count !== $expectedCount) {
            throw ProjectUndoConflict::relationChanged($payload['relation'], $this->relationId($payload['keys']));
        }

        (bool) $payload['after_exists']
            ? $this->deleteRelation($payload['relation'], $payload['keys'])
            : $this->insertRelation($payload['relation'], $payload['keys']);
    }

    private function assertCurrentSnapshot(string $resource, string $id, array $expected): void
    {
        $current = $this->currentSnapshot($resource, $id);
        if ($current === null) {
            throw ProjectUndoConflict::missingResource($resource, $id);
        }

        if ($current != $expected) {
            throw ProjectUndoConflict::snapshotChanged($resource, $id);
        }
    }

    private function currentSnapshot(string $resource, string $id): ?array
    {
        return match ($resource) {
            'column' => ($model = Column::find($id)) ? $this->snapshots->column($model) : null,
            'note' => ($model = Note::find($id)) ? $this->snapshots->note($model) : null,
            'pin' => ($model = Pin::find($id)) ? $this->snapshots->pin($model) : null,
            'subtask' => ($model = Subtask::find($id)) ? $this->snapshots->subtask($model) : null,
            'tag' => ($model = Tag::find($id)) ? $this->snapshots->tag($model) : null,
            'task' => ($model = Task::find($id)) ? $this->snapshots->task($model) : null,
            default => throw ProjectUndoConflict::missingResource('resource type', $resource),
        };
    }

    private function restoreMissingResource(string $resource, array $snapshot): void
    {
        match ($resource) {
            'column' => $this->restorer->restoreColumn($snapshot),
            'note' => $this->restorer->restoreNote($snapshot),
            'pin' => $this->restorer->restorePin($snapshot),
            'subtask' => $this->restorer->restoreSubtask($snapshot),
            'tag' => $this->restorer->restoreTag($snapshot),
            'task' => $this->restorer->restoreTask($snapshot),
            default => throw ProjectUndoConflict::missingResource('resource type', $resource),
        };
    }

    private function restoreExistingResource(string $resource, array $snapshot): void
    {
        match ($resource) {
            'column' => $this->restorer->replaceColumn($snapshot),
            'note' => $this->restorer->replaceNote($snapshot),
            'pin' => $this->restorer->replacePin($snapshot),
            'subtask' => $this->restorer->replaceSubtask($snapshot),
            'tag' => $this->restorer->replaceTag($snapshot),
            'task' => $this->restorer->replaceTask($snapshot),
            default => throw ProjectUndoConflict::missingResource('resource type', $resource),
        };
    }

    private function deleteResource(string $resource, string $id): void
    {
        match ($resource) {
            'column' => Column::findOrFail($id)->delete(),
            'note' => Note::findOrFail($id)->delete(),
            'pin' => Pin::findOrFail($id)->delete(),
            'subtask' => Subtask::findOrFail($id)->delete(),
            'tag' => Tag::findOrFail($id)->delete(),
            'task' => Task::findOrFail($id)->delete(),
            default => throw ProjectUndoConflict::missingResource('resource type', $resource),
        };
    }

    private function currentOrderState(string $resource, int|string|null $projectId, array $ids): array
    {
        $project = Project::findOrFail($projectId);

        return match ($resource) {
            'columns' => $this->snapshots->columnOrderState($project, $ids),
            'pins' => $this->snapshots->pinOrderState($project, $ids),
            'tasks' => $this->snapshots->taskOrderState($project, $ids),
            default => throw ProjectUndoConflict::missingResource('order resource', $resource),
        };
    }

    private function restoreOrder(string $resource, array $states): void
    {
        match ($resource) {
            'columns' => $this->restorer->applyPositionOrder('columns', $states),
            'pins' => $this->restorer->applyPositionOrder('pins', $states),
            'tasks' => $this->restorer->applyTaskOrder($states),
            default => throw ProjectUndoConflict::missingResource('order resource', $resource),
        };
    }

    private function relationCount(string $table, array $keys): int
    {
        return DB::table($table)->where($keys)->count();
    }

    private function deleteRelation(string $table, array $keys): void
    {
        DB::table($table)->where($keys)->delete();
    }

    private function insertRelation(string $table, array $keys): void
    {
        DB::table($table)->insert(array_merge($keys, $this->timestamps()));
    }

    private function snapshotId(array $snapshot): string
    {
        return (string) $snapshot['attributes']['id'];
    }

    private function relationId(array $keys): string
    {
        return collect($keys)->map(fn (int|string $value, string $key): string => "{$key}:{$value}")->implode(',');
    }

    private function timestamps(): array
    {
        $now = now()->format('Y-m-d H:i:s');

        return ['created_at' => $now, 'updated_at' => $now];
    }

    private function isCreateType(ProjectUndoActionType $type): bool
    {
        return in_array($type, [
            ProjectUndoActionType::CREATE_COLUMN,
            ProjectUndoActionType::CREATE_NOTE,
            ProjectUndoActionType::CREATE_PIN,
            ProjectUndoActionType::CREATE_SUBTASK,
            ProjectUndoActionType::CREATE_TAG,
            ProjectUndoActionType::CREATE_TASK,
        ], true);
    }

    private function isUpdateType(ProjectUndoActionType $type): bool
    {
        return in_array($type, [
            ProjectUndoActionType::MOVE_NOTE,
            ProjectUndoActionType::MOVE_PIN,
            ProjectUndoActionType::MOVE_TASK,
            ProjectUndoActionType::UPDATE_COLUMN,
            ProjectUndoActionType::UPDATE_NOTE,
            ProjectUndoActionType::UPDATE_SUBTASK,
            ProjectUndoActionType::UPDATE_TAG,
            ProjectUndoActionType::UPDATE_TASK,
        ], true);
    }

    private function isDeleteType(ProjectUndoActionType $type): bool
    {
        return in_array($type, [
            ProjectUndoActionType::DELETE_COLUMN,
            ProjectUndoActionType::DELETE_NOTE,
            ProjectUndoActionType::DELETE_PIN,
            ProjectUndoActionType::DELETE_SUBTASK,
            ProjectUndoActionType::DELETE_TAG,
            ProjectUndoActionType::DELETE_TASK,
        ], true);
    }

    private function isReorderType(ProjectUndoActionType $type): bool
    {
        return in_array($type, [
            ProjectUndoActionType::REORDER_COLUMNS,
            ProjectUndoActionType::REORDER_PINS,
            ProjectUndoActionType::REORDER_TASKS,
        ], true);
    }
}
