<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProjectController extends Controller
{
    public function store(Request $request){
       $validated =  $request->validate([
            'title' => ['required', 'string', 'max:50']
        ]);

        $project = Project::create($validated);

        // todo -> add other selected members
        $project->members()->attach(Auth::user());

        return to_route('traceboard', ['project' => $project]);
    }
}
