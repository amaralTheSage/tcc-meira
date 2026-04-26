<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConnectionsController extends Controller
{
    /**
     * Create a directed task connection.
     *
     * Example: POST /{project}/connect.
     */
    public function connect(Project $project, Request $request): RedirectResponse
    {
        DB::table('task_connections')->insert($this->validatedConnection($request));

        return back();
    }

    /**
     * Delete a directed task connection.
     *
     * Example: POST /{project}/disconnect.
     */
    public function disconnect(Project $project, Request $request): RedirectResponse
    {
        DB::table('task_connections')->where($this->validatedConnection($request))->delete();

        return back();
    }

    /**
     * @return array{source_id: string, target_id: string}
     */
    private function validatedConnection(Request $request): array
    {
        return $request->validate([
            'source_id' => ['required', 'string', 'exists:tasks,id'],
            'target_id' => ['required', 'string', 'exists:tasks,id'],
        ]);
    }
}
