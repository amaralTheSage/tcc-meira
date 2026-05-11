<?php

namespace App\Services\ProjectUndo;

use App\Models\Column;
use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\Subtask;
use App\Models\Tag;
use App\Models\Task;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use UnitEnum;

class ProjectBoardSnapshotter
{
    private const COLUMN_FIELDS = ['id', 'name', 'position', 'project_id', 'type', 'created_at', 'updated_at'];

    private const NOTE_FIELDS = ['id', 'text', 'x', 'y', 'project_id', 'created_at', 'updated_at'];

    private const PIN_FIELDS = ['id', 'text', 'project_id', 'title', 'url', 'position', 'x', 'y', 'created_at', 'updated_at'];

    private const SUBTASK_FIELDS = ['id', 'title', 'position', 'completed', 'task_id', 'created_at', 'updated_at'];

    private const TAG_FIELDS = ['id', 'project_id', 'name', 'color', 'created_at', 'updated_at'];

    private const TASK_FIELDS = [
        'id',
        'title',
        'image',
        'x',
        'y',
        'column_id',
        'project_id',
        'sprint_id',
        'position',
        'description',
        'status',
        'created_at',
        'updated_at',
    ];

    /**
     * Snapshot a task plus related board rows that are deleted with it.
     *
     * Example: $snapshotter->task($task).
     */
    public function task(Task $task): array
    {
        return [
            'attributes' => $this->attributes($task, self::TASK_FIELDS),
            'subtasks' => $this->subtaskSnapshots($task),
            'tag_ids' => $this->stringIds($task->tags()->pluck('tags.id')),
            'user_ids' => $this->integerIds($task->users()->pluck('users.id')),
            'connections' => $this->taskConnections($task),
        ];
    }

    public function note(Note $note): array
    {
        return ['attributes' => $this->attributes($note, self::NOTE_FIELDS)];
    }

    public function column(Column $column): array
    {
        return [
            'attributes' => $this->attributes($column, self::COLUMN_FIELDS),
            'tasks' => $this->columnTaskSnapshots($column),
        ];
    }

    public function subtask(Subtask $subtask): array
    {
        return [
            'attributes' => $this->attributes($subtask, self::SUBTASK_FIELDS),
            'task_attributes' => $this->attributes($subtask->task, self::TASK_FIELDS),
            'tag_ids' => $this->subtaskTagIds($subtask),
            'user_ids' => $this->integerIds($subtask->users()->pluck('users.id')),
        ];
    }

    public function pin(Pin $pin): array
    {
        return ['attributes' => $this->attributes($pin, self::PIN_FIELDS)];
    }

    public function tag(Tag $tag): array
    {
        return [
            'attributes' => $this->attributes($tag, self::TAG_FIELDS),
            'task_ids' => $this->stringIds($tag->tasks()->pluck('tasks.id')),
            'subtask_ids' => $this->taggedSubtaskIds($tag),
        ];
    }

    public function columnOrderState(Project $project, array $columnIds): array
    {
        return $this->orderedState($project->columns()->whereIn('id', $columnIds)->get(), ['id', 'position']);
    }

    public function pinOrderState(Project $project, array $pinIds): array
    {
        return $this->orderedState($project->pins()->whereIn('id', $pinIds)->get(), ['id', 'position']);
    }

    public function taskOrderState(Project $project, array $taskIds): array
    {
        return $this->orderedState($project->tasks()->whereIn('id', $taskIds)->get(), ['id', 'column_id', 'position', 'status']);
    }

    public function taskAttributes(Task $task): array
    {
        return $this->attributes($task, self::TASK_FIELDS);
    }

    public function withMovedPosition(array $snapshot, int $x, int $y): array
    {
        $snapshot['attributes']['x'] = $x;
        $snapshot['attributes']['y'] = $y;

        return $snapshot;
    }

    private function subtaskSnapshots(Task $task): array
    {
        return $task->subtasks()
            ->orderBy('position')
            ->get()
            ->map(fn (Subtask $subtask): array => $this->subtask($subtask))
            ->values()
            ->all();
    }

    private function columnTaskSnapshots(Column $column): array
    {
        return $column->tasks()
            ->orderBy('position')
            ->get()
            ->map(fn (Task $task): array => $this->task($task))
            ->values()
            ->all();
    }

    private function taskConnections(Task $task): array
    {
        return DB::table('task_connections')
            ->where('source_id', $task->id)
            ->orWhere('target_id', $task->id)
            ->orderBy('source_id')
            ->orderBy('target_id')
            ->get(['source_id', 'target_id'])
            ->map(fn (object $row): array => ['source_id' => (string) $row->source_id, 'target_id' => (string) $row->target_id])
            ->values()
            ->all();
    }

    private function subtaskTagIds(Subtask $subtask): array
    {
        return $this->stringIds(DB::table('subtask_tag')->where('subtask_id', $subtask->id)->pluck('tag_id'));
    }

    private function taggedSubtaskIds(Tag $tag): array
    {
        return $this->stringIds(DB::table('subtask_tag')->where('tag_id', $tag->id)->pluck('subtask_id'));
    }

    private function orderedState(Collection $models, array $fields): array
    {
        return $models
            ->sortBy(fn (Model $model): string => (string) $model->getAttribute('id'))
            ->map(fn (Model $model): array => $this->attributes($model, $fields))
            ->values()
            ->all();
    }

    private function attributes(Model $model, array $fields): array
    {
        $attributes = [];

        foreach ($fields as $field) {
            $attributes[$field] = $this->attribute($model, $field);
        }

        return $attributes;
    }

    private function attribute(Model $model, string $field): int|float|string|bool|null
    {
        $value = $model->getAttribute($field);

        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        return $value instanceof UnitEnum ? $value->value : $value;
    }

    private function integerIds(Collection $ids): array
    {
        return $ids->map(fn (int|string $id): int => (int) $id)->sort()->values()->all();
    }

    private function stringIds(Collection $ids): array
    {
        return $ids->map(fn (int|string $id): string => (string) $id)->sort()->values()->all();
    }
}
