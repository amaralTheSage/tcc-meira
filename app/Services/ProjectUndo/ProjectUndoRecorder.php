<?php

namespace App\Services\ProjectUndo;

use App\Enums\ProjectUndoActionType;
use App\Models\Project;
use App\Models\ProjectUndoAction;
use App\Models\User;

class ProjectUndoRecorder
{
    /**
     * Store a recoverable undo action for one project member.
     *
     * Example: $recorder->recordCreated($project, $user, ProjectUndoActionType::CREATE_TASK, 'Create task', 'task', $snapshot).
     */
    public function recordCreated(
        Project $project,
        User $user,
        ProjectUndoActionType $type,
        string $label,
        string $resource,
        array $after
    ): ProjectUndoAction {
        return $this->record($project, $user, $type, $label, [
            'resource' => $resource,
            'after' => $after,
        ]);
    }

    public function recordUpdated(
        Project $project,
        User $user,
        ProjectUndoActionType $type,
        string $label,
        string $resource,
        array $before,
        array $after
    ): ?ProjectUndoAction {
        if ($before == $after) {
            return null;
        }

        return $this->record($project, $user, $type, $label, [
            'resource' => $resource,
            'before' => $before,
            'after' => $after,
        ]);
    }

    public function recordDeleted(
        Project $project,
        User $user,
        ProjectUndoActionType $type,
        string $label,
        string $resource,
        array $before
    ): ProjectUndoAction {
        return $this->record($project, $user, $type, $label, [
            'resource' => $resource,
            'before' => $before,
        ]);
    }

    public function recordRelation(Project $project, User $user, ProjectUndoActionType $type, string $label, array $payload): ProjectUndoAction
    {
        return $this->record($project, $user, $type, $label, $payload);
    }

    public function recordReorder(Project $project, User $user, ProjectUndoActionType $type, string $resource, array $before, array $after): ?ProjectUndoAction
    {
        if ($before == $after) {
            return null;
        }

        return $this->record($project, $user, $type, "Reorder {$resource}", [
            'resource' => $resource,
            'project_id' => $project->id,
            'before' => $before,
            'after' => $after,
        ]);
    }

    /**
     * Store one undoable traceboard move per node until another user action happens.
     *
     * Example: $recorder->recordTraceboardMove($project, $user, ProjectUndoActionType::MOVE_TASK, 'Move task', 'task', $before, $after).
     */
    public function recordTraceboardMove(
        Project $project,
        User $user,
        ProjectUndoActionType $type,
        string $label,
        string $resource,
        array $before,
        array $after
    ): ?ProjectUndoAction {
        if (! $this->snapshotPositionChanged($before, $after)) {
            return null;
        }

        $latest = $this->latest($project, $user);
        if ($this->isSameTraceboardMove($latest, $type, $resource, $after)) {
            return $this->replaceLatestTraceboardMove($latest, $after);
        }

        return $this->recordUpdated($project, $user, $type, $label, $resource, $before, $after);
    }

    public function latest(Project $project, User $user): ?ProjectUndoAction
    {
        return ProjectUndoAction::query()
            ->where('project_id', $project->id)
            ->where('user_id', $user->id)
            ->whereNull('undone_at')
            ->latest('id')
            ->first();
    }

    /**
     * @return array{can_undo: bool, label?: string}
     */
    public function summary(Project $project, User $user): array
    {
        $latest = $this->latest($project, $user);

        return $latest === null
            ? ['can_undo' => false]
            : ['can_undo' => true, 'label' => $latest->action_label];
    }

    private function record(Project $project, User $user, ProjectUndoActionType $type, string $label, array $payload): ProjectUndoAction
    {
        return ProjectUndoAction::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'action_type' => $type,
            'action_label' => $label,
            'undo_payload' => $payload,
        ]);
    }

    private function isSameTraceboardMove(?ProjectUndoAction $action, ProjectUndoActionType $type, string $resource, array $after): bool
    {
        if ($action === null || $action->action_type !== $type) {
            return false;
        }

        $payload = $action->undo_payload;

        return ($payload['resource'] ?? null) === $resource
            && $this->snapshotId($payload['after'] ?? []) === $this->snapshotId($after);
    }

    private function replaceLatestTraceboardMove(ProjectUndoAction $action, array $after): ?ProjectUndoAction
    {
        $payload = $action->undo_payload;
        $before = $this->refreshedMoveBefore($payload['before'], $after);
        if (! $this->snapshotPositionChanged($before, $after)) {
            $action->delete();

            return null;
        }

        $action->update(['undo_payload' => array_merge($payload, ['before' => $before, 'after' => $after])]);

        return $action->refresh();
    }

    private function refreshedMoveBefore(array $before, array $after): array
    {
        $position = $this->snapshotPosition($before);
        $nextBefore = $after;
        $nextBefore['attributes']['x'] = $position['x'];
        $nextBefore['attributes']['y'] = $position['y'];

        return $nextBefore;
    }

    private function snapshotPositionChanged(array $before, array $after): bool
    {
        return $this->snapshotPosition($before) !== $this->snapshotPosition($after);
    }

    /**
     * @return array{x: int, y: int}
     */
    private function snapshotPosition(array $snapshot): array
    {
        return [
            'x' => (int) $snapshot['attributes']['x'],
            'y' => (int) $snapshot['attributes']['y'],
        ];
    }

    private function snapshotId(array $snapshot): ?string
    {
        return isset($snapshot['attributes']['id']) ? (string) $snapshot['attributes']['id'] : null;
    }
}
