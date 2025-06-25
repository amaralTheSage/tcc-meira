<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConnectionsController extends Controller
{
    public function connect(Project $project, Request $request)
    {
        DB::table('task_connections')->insert(['source_id' => $request->source_id, 'target_id' => $request->target_id]);

        return back();
    }

    public function disconnect(Project $project, Request $request)
    {
        DB::table('task_connections')->where(['source_id' => $request->source_id, 'target_id' => $request->target_id])->delete();

        return back();
    }
}
