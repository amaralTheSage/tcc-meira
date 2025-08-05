<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProjectController extends Controller
{
    public function index() {
        $projects = Auth::user()->projects()->with('members')->get();

        return Inertia::render('home', [
            'projects' => $projects
        ]);
    }


    public function store(Request $request){
       $validated =  $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'selectedUsers' => ['nullable', 'array' ]
        ]);

        $project = Project::create($validated);

        $project->members()->attach(Auth::user());

        foreach ($request->selectedUsers as $index => $id) {
            $project->members()->attach($id);
        }

        return to_route('traceboard', ['project' => $project]);
    }

    # Project Settings 
    public function  edit(Project $project) {
            return Inertia::render('project/project-settings', ['project' => $project->load('members')]);
    }

    public function update(Project $project, Request $request){
        $validated =  $request->validate([
            'edge_type' => ['in:bezier,straight,step,smoothstep,default'],
            'animated_edges' => ['boolean'],
        ]);

        $project->update($validated);

        return back();
    }
}
