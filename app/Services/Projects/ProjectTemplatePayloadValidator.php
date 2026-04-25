<?php

namespace App\Services\Projects;

use InvalidArgumentException;

class ProjectTemplatePayloadValidator
{
    private const TOP_LEVEL_COLLECTIONS = ['columns', 'tasks', 'sprints', 'pins', 'notes', 'documents', 'task_connections'];

    private const COLUMN_SCALAR_FIELDS = ['id', 'name', 'type', 'position'];

    private const TASK_SCALAR_FIELDS = [
        'id',
        'title',
        'image',
        'description',
        'status',
        'column_id',
        'sprint_id',
        'x',
        'y',
        'position',
        'project_id',
        'created_at',
    ];

    private const SUBTASK_SCALAR_FIELDS = ['id', 'task_id', 'title', 'description', 'completed', 'position'];

    private const SPRINT_SCALAR_FIELDS = ['id', 'title', 'project_id', 'start_at', 'end_at', 'status', 'goal', 'color', 'created_at', 'updated_at'];

    private const PIN_SCALAR_FIELDS = ['id', 'title', 'url', 'text', 'position', 'x', 'y'];

    private const NOTE_SCALAR_FIELDS = ['id', 'text', 'x', 'y'];

    private const DOCUMENT_SCALAR_FIELDS = ['id', 'title', 'markdown', 'version', 'last_edited_by'];

    private const CONNECTION_SCALAR_FIELDS = ['id', 'source_id', 'target_id'];

    /**
     * Validate the serialized template payload before cloning begins.
     *
     * Example: $validator->validate($template->data).
     */
    public function validate(array|object|string|int|float|bool|null $payload): void
    {
        if (! is_array($payload)) {
            $this->fail('data', $payload, 'an associative array');
        }

        foreach (self::TOP_LEVEL_COLLECTIONS as $collectionName) {
            $this->validateTopLevelCollection($payload, $collectionName);
        }
    }

    private function validateTopLevelCollection(array $payload, string $collectionName): void
    {
        if (! array_key_exists($collectionName, $payload)) {
            return;
        }

        if (! is_array($payload[$collectionName])) {
            $this->fail($collectionName, $payload[$collectionName], 'an array');
        }

        $this->validateCollectionItems($collectionName, $payload[$collectionName]);
    }

    private function validateCollectionItems(string $collectionName, array $collectionItems): void
    {
        foreach ($collectionItems as $index => $item) {
            $this->validateCollectionItem($collectionName, $index, $item);
        }
    }

    private function validateCollectionItem(
        string $collectionName,
        string|int $index,
        array|object|string|int|float|bool|null $item,
    ): void {
        $path = "{$collectionName}.{$index}";

        match ($collectionName) {
            'columns' => $this->validateColumn($path, $item),
            'tasks' => $this->validateTask($path, $item),
            'sprints' => $this->validateScalarRecord($path, $item, self::SPRINT_SCALAR_FIELDS),
            'pins' => $this->validateScalarRecord($path, $item, self::PIN_SCALAR_FIELDS),
            'notes' => $this->validateScalarRecord($path, $item, self::NOTE_SCALAR_FIELDS),
            'documents' => $this->validateScalarRecord($path, $item, self::DOCUMENT_SCALAR_FIELDS),
            'task_connections' => $this->validateScalarRecord($path, $item, self::CONNECTION_SCALAR_FIELDS),
        };
    }

    private function validateColumn(string $path, array|object|string|int|float|bool|null $item): void
    {
        $this->validateScalarRecord($path, $item, self::COLUMN_SCALAR_FIELDS);
    }

    private function validateTask(string $path, array|object|string|int|float|bool|null $item): void
    {
        $task = $this->recordFromItem($path, $item);

        $this->validateScalarFields($path, $task, self::TASK_SCALAR_FIELDS);
        $this->validateArrayFieldWhenPresent($path, $task, 'subtasks');
        $this->validateTaskSubtasks($path, $task);
    }

    private function validateTaskSubtasks(string $path, array $task): void
    {
        if (! array_key_exists('subtasks', $task)) {
            return;
        }

        foreach ($task['subtasks'] as $index => $subtask) {
            $subtaskPath = "{$path}.subtasks.{$index}";
            $this->validateScalarRecord($subtaskPath, $subtask, self::SUBTASK_SCALAR_FIELDS);
        }
    }

    private function validateScalarRecord(
        string $path,
        array|object|string|int|float|bool|null $item,
        array $fields,
    ): void {
        $this->validateScalarFields($path, $this->recordFromItem($path, $item), $fields);
    }

    private function validateScalarFields(string $path, array $record, array $fields): void
    {
        foreach ($fields as $field) {
            if (! array_key_exists($field, $record) || $this->isScalarOrNull($record[$field])) {
                continue;
            }

            $this->fail("{$path}.{$field}", $record[$field], 'a scalar or null value');
        }
    }

    private function validateArrayFieldWhenPresent(string $path, array $record, string $field): void
    {
        if (! array_key_exists($field, $record) || is_array($record[$field])) {
            return;
        }

        $this->fail("{$path}.{$field}", $record[$field], 'an array');
    }

    private function recordFromItem(string $path, array|object|string|int|float|bool|null $item): array
    {
        if (is_array($item)) {
            return $item;
        }

        if (is_object($item)) {
            return get_object_vars($item);
        }

        $this->fail($path, $item, 'an array or object');
    }

    private function isScalarOrNull(array|object|string|int|float|bool|null $value): bool
    {
        return $value === null || is_scalar($value);
    }

    private function fail(string $path, array|object|string|int|float|bool|null $value, string $expected): never
    {
        $encodedValue = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $offendingValue = $encodedValue === false ? get_debug_type($value) : $encodedValue;

        throw new InvalidArgumentException("Invalid template payload at {$path}: {$offendingValue}; expected {$expected}.");
    }
}
