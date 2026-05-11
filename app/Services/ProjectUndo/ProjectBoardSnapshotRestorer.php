<?php

namespace App\Services\ProjectUndo;

use Illuminate\Support\Facades\DB;

class ProjectBoardSnapshotRestorer
{
    public function restoreTask(array $snapshot): void
    {
        $this->insertTaskRows($snapshot);
        $this->restoreTaskConnections($snapshot['connections'] ?? []);
    }

    public function replaceTask(array $snapshot): void
    {
        $taskId = (string) $snapshot['attributes']['id'];
        $this->updateRow('tasks', 'id', $taskId, $snapshot['attributes']);
        $this->syncTaskRelations($taskId, $snapshot);
        $this->replaceTaskSubtasks($taskId, $snapshot['subtasks'] ?? []);
        $this->replaceTaskConnections($taskId, $snapshot['connections'] ?? []);
    }

    public function restoreColumn(array $snapshot): void
    {
        DB::table('columns')->insert($snapshot['attributes']);

        foreach ($snapshot['tasks'] ?? [] as $taskSnapshot) {
            $this->insertTaskRows($taskSnapshot);
        }

        foreach ($snapshot['tasks'] ?? [] as $taskSnapshot) {
            $this->restoreTaskConnections($taskSnapshot['connections'] ?? []);
        }
    }

    public function replaceColumn(array $snapshot): void
    {
        $columnId = (string) $snapshot['attributes']['id'];
        $this->updateRow('columns', 'id', $columnId, $snapshot['attributes']);
        $this->replaceColumnTasks($columnId, $snapshot['tasks'] ?? []);
    }

    public function restoreSubtask(array $snapshot): void
    {
        DB::table('subtasks')->insert($snapshot['attributes']);
        $this->syncSubtaskRelations((string) $snapshot['attributes']['id'], $snapshot);
    }

    public function replaceSubtask(array $snapshot): void
    {
        $subtaskId = (string) $snapshot['attributes']['id'];
        $this->updateRow('subtasks', 'id', $subtaskId, $snapshot['attributes']);
        $this->restoreSubtaskParentTask($snapshot);
        $this->syncSubtaskRelations($subtaskId, $snapshot);
    }

    public function restoreNote(array $snapshot): void
    {
        DB::table('notes')->insert($snapshot['attributes']);
    }

    public function replaceNote(array $snapshot): void
    {
        $this->updateRow('notes', 'id', (string) $snapshot['attributes']['id'], $snapshot['attributes']);
    }

    public function restorePin(array $snapshot): void
    {
        DB::table('pins')->insert($snapshot['attributes']);
    }

    public function replacePin(array $snapshot): void
    {
        $this->updateRow('pins', 'id', (string) $snapshot['attributes']['id'], $snapshot['attributes']);
    }

    public function restoreTag(array $snapshot): void
    {
        DB::table('tags')->insert($snapshot['attributes']);
        $this->syncTagRelations((string) $snapshot['attributes']['id'], $snapshot);
    }

    public function replaceTag(array $snapshot): void
    {
        $tagId = (string) $snapshot['attributes']['id'];
        $this->updateRow('tags', 'id', $tagId, $snapshot['attributes']);
        $this->syncTagRelations($tagId, $snapshot);
    }

    public function applyTaskOrder(array $states): void
    {
        foreach ($states as $state) {
            DB::table('tasks')->where('id', $state['id'])->update($this->taskOrderUpdates($state));
        }
    }

    public function applyPositionOrder(string $table, array $states): void
    {
        foreach ($states as $state) {
            DB::table($table)->where('id', $state['id'])->update(['position' => $state['position']]);
        }
    }

    private function insertTaskRows(array $snapshot): void
    {
        DB::table('tasks')->insert($snapshot['attributes']);
        $taskId = (string) $snapshot['attributes']['id'];
        $this->syncTaskRelations($taskId, $snapshot);

        foreach ($snapshot['subtasks'] ?? [] as $subtaskSnapshot) {
            $this->restoreSubtask($subtaskSnapshot);
        }
    }

    private function replaceTaskSubtasks(string $taskId, array $subtasks): void
    {
        $subtaskIds = collect($subtasks)->pluck('attributes.id')->all();
        $query = DB::table('subtasks')->where('task_id', $taskId);
        $subtaskIds === [] ? $query->delete() : $query->whereNotIn('id', $subtaskIds)->delete();

        foreach ($subtasks as $subtaskSnapshot) {
            $this->upsertSubtask($subtaskSnapshot);
        }
    }

    private function replaceColumnTasks(string $columnId, array $tasks): void
    {
        $taskIds = collect($tasks)->pluck('attributes.id')->all();
        $query = DB::table('tasks')->where('column_id', $columnId);
        $taskIds === [] ? $query->delete() : $query->whereNotIn('id', $taskIds)->delete();

        foreach ($tasks as $taskSnapshot) {
            $this->upsertTask($taskSnapshot);
        }
    }

    private function upsertTask(array $snapshot): void
    {
        $taskId = (string) $snapshot['attributes']['id'];

        DB::table('tasks')->where('id', $taskId)->exists()
            ? $this->replaceTask($snapshot)
            : $this->restoreTask($snapshot);
    }

    private function upsertSubtask(array $snapshot): void
    {
        $subtaskId = (string) $snapshot['attributes']['id'];

        DB::table('subtasks')->where('id', $subtaskId)->exists()
            ? $this->replaceSubtask($snapshot)
            : $this->restoreSubtask($snapshot);
    }

    private function replaceTaskConnections(string $taskId, array $connections): void
    {
        DB::table('task_connections')->where('source_id', $taskId)->orWhere('target_id', $taskId)->delete();
        $this->restoreTaskConnections($connections);
    }

    private function restoreTaskConnections(array $connections): void
    {
        foreach ($connections as $connection) {
            $this->ensureConnectionTasksExist($connection);
            DB::table('task_connections')->updateOrInsert($connection, $this->timestamps());
        }
    }

    private function syncTaskRelations(string $taskId, array $snapshot): void
    {
        $this->syncRows('task_user', 'task_id', $taskId, 'user_id', $snapshot['user_ids'] ?? []);
        $this->syncRows('tag_task', 'task_id', $taskId, 'tag_id', $snapshot['tag_ids'] ?? []);
    }

    private function syncSubtaskRelations(string $subtaskId, array $snapshot): void
    {
        $this->syncRows('subtask_user', 'subtask_id', $subtaskId, 'user_id', $snapshot['user_ids'] ?? []);
        $this->syncRows('subtask_tag', 'subtask_id', $subtaskId, 'tag_id', $snapshot['tag_ids'] ?? []);
    }

    private function restoreSubtaskParentTask(array $snapshot): void
    {
        if (! isset($snapshot['task_attributes'])) {
            return;
        }

        $taskId = (string) $snapshot['task_attributes']['id'];
        $this->updateRow('tasks', 'id', $taskId, $snapshot['task_attributes']);
    }

    private function syncTagRelations(string $tagId, array $snapshot): void
    {
        $this->syncRows('tag_task', 'tag_id', $tagId, 'task_id', $snapshot['task_ids'] ?? []);
        $this->syncRows('subtask_tag', 'tag_id', $tagId, 'subtask_id', $snapshot['subtask_ids'] ?? []);
    }

    private function syncRows(string $table, string $ownerKey, int|string $ownerId, string $relatedKey, array $relatedIds): void
    {
        DB::table($table)->where($ownerKey, $ownerId)->delete();

        foreach ($relatedIds as $relatedId) {
            DB::table($table)->insert(array_merge([$ownerKey => $ownerId, $relatedKey => $relatedId], $this->timestamps()));
        }
    }

    private function ensureConnectionTasksExist(array $connection): void
    {
        foreach (['source_id', 'target_id'] as $key) {
            if (! DB::table('tasks')->where('id', $connection[$key])->exists()) {
                throw ProjectUndoConflict::missingResource('task', (string) $connection[$key]);
            }
        }
    }

    private function taskOrderUpdates(array $state): array
    {
        return [
            'column_id' => $state['column_id'] ?? null,
            'position' => $state['position'] ?? null,
            'status' => $state['status'] ?? null,
        ];
    }

    private function updateRow(string $table, string $key, int|string $id, array $attributes): void
    {
        DB::table($table)->where($key, $id)->update($attributes);
    }

    private function timestamps(): array
    {
        $now = now()->format('Y-m-d H:i:s');

        return ['created_at' => $now, 'updated_at' => $now];
    }
}
