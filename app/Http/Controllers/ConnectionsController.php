<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Events\TaskConnectionChanged;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Task;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConnectionsController extends Controller
{
    use GuardsProjectResources;

    /**
     * Create a directed task connection.
     *
     * Example: POST /{project}/connect.
     */
    public function connect(Project $project, Request $request, ProjectUndoRecorder $undo): RedirectResponse
    {
        $connection = $this->validatedConnection($project, $request);

        if (! $this->connectionExists($connection)) {
            DB::table('task_connections')->insert($connection);
            $this->recordConnection($project, $request, $undo, ProjectUndoActionType::CONNECT_TASKS, 'Connect tasks', $connection, true);
            $this->broadcastConnectionChanged($request, $connection, true);
        }

        return back();
    }

    /**
     * Delete a directed task connection.
     *
     * Example: POST /{project}/disconnect.
     */
    public function disconnect(Project $project, Request $request, ProjectUndoRecorder $undo): RedirectResponse
    {
        $connection = $this->validatedConnection($project, $request);
        $wasConnected = $this->connectionExists($connection);

        DB::table('task_connections')->where($connection)->delete();

        if ($wasConnected) {
            $this->recordConnection($project, $request, $undo, ProjectUndoActionType::DISCONNECT_TASKS, 'Disconnect tasks', $connection, false);
            $this->broadcastConnectionChanged($request, $connection, false);
        }

        return back();
    }

    /**
     * @return array{source_id: string, target_id: string}
     */
    private function validatedConnection(Project $project, Request $request): array
    {
        $validated = $request->validate([
            'source_id' => ['required', 'string', 'exists:tasks,id'],
            'target_id' => ['required', 'string', 'exists:tasks,id'],
        ]);

        $this->ensureTaskBelongsToProject($project, Task::findOrFail($validated['source_id']));
        $this->ensureTaskBelongsToProject($project, Task::findOrFail($validated['target_id']));

        return $validated;
    }

    /**
     * @param  array{source_id: string, target_id: string}  $connection
     */
    private function connectionExists(array $connection): bool
    {
        return DB::table('task_connections')->where($connection)->exists();
    }

    /**
     * @param  array{source_id: string, target_id: string}  $connection
     */
    private function recordConnection(
        Project $project,
        Request $request,
        ProjectUndoRecorder $undo,
        ProjectUndoActionType $type,
        string $label,
        array $connection,
        bool $afterExists
    ): void {
        $undo->recordRelation($project, $request->user(), $type, $label, [
            'relation' => 'task_connections',
            'keys' => $connection,
            'after_exists' => $afterExists,
        ]);
    }

    /**
     * @param  array{source_id: string, target_id: string}  $connection
     */
    private function broadcastConnectionChanged(Request $request, array $connection, bool $connected): void
    {
        broadcast(new TaskConnectionChanged(
            $connection['source_id'],
            $connection['target_id'],
            $connected,
            $request->user()->id
        ))->toOthers();
    }
}
