<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Task;
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
    public function connect(Project $project, Request $request): RedirectResponse
    {
        DB::table('task_connections')->insert($this->validatedConnection($project, $request));

        return back();
    }

    /**
     * Delete a directed task connection.
     *
     * Example: POST /{project}/disconnect.
     */
    public function disconnect(Project $project, Request $request): RedirectResponse
    {
        DB::table('task_connections')->where($this->validatedConnection($project, $request))->delete();

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
}
