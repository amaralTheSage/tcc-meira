<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConnectionsController extends Controller
{
    public function connect(Project $project, Request $request)
    {
        dump($request);

        DB::table('task_connections')->create(['source_id' => $request->source, 'target_id' => $request->target]);

        return back();
    }
}
