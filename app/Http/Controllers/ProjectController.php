<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Http\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Str;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Auth::user()->projects()->with('members')->get();


        $users = User::whereNot('id', Auth::id());

        return Inertia::render('home', [
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'selectedUsers' => ['nullable', 'array'],
        ]);

        $project = Project::create($validated);

        $project->members()->attach(Auth::user());

        foreach ($request->selectedUsers as $index => $id) {
            $project->members()->attach($id);
        }

        return to_route('traceboard', ['project' => $project]);
    }

    // Project Settings
    public function edit(Project $project)
    {
        return Inertia::render('project/project-settings', ['project' => $project->load('members')]);
    }

    public function update(Project $project, Request $request)
    {
        $validated = $request->validate([
            'edge_type' => ['in:bezier,straight,step,smoothstep,default'],
            'animated_edges' => ['boolean'],
        ]);

        $project->update($validated);

        return back();
    }

    public function publishing_form(Project $project)
    {
        return Inertia::render('project/publish', ['project' => $project->load('members')]);
    }

    public function publish(Project $project, Request $request)
    {

        # to-do: validate better
        $validated = $request->validate([
            'title' => 'required',
            'description' => 'required|min:200',
            'create_template' => 'boolean',
            'images' => 'required|array',
        ]);


        $templateData = [
            'columns'        => $project->columns()->orderBy('position')->get()->toArray(),
            'tasks'          => $project->tasks()->with(['subtasks'])->orderBy('position')->get()->toArray(),
            'pins'           => $project->pins()->orderBy('position')->get()->toArray(),
            'notes'          => $project->notes()->get()->toArray(),
            // 'project_users'  => $project->members()->pluck('id')->map(fn($id) => ['user_id' => $id])->toArray(),
            'task_connections' => DB::table('task_connections')
                ->whereIn('source_id', $project->tasks->pluck('id'))
                ->get()
                ->toArray(),

        ];

        $templateName = strval('Template ' . $validated['title']);

        # cria o template
        if ($request['create_template']) {
            ProjectTemplate::create([
                'user_id' => Auth::id(),
                'name'    => $templateName,
                'project_id' => $project->id,
                'data'    => $templateData
            ]);
        }


        $post = CommunityPost::create($validated);

        $post->members()->attach($project->members);

        // fix
        // foreach ($request->images as $image) {
        //     $path = Storage::disk('public')->putFile('posts', $image);

        //     DB::table('image_post')->insert([
        //         'post_id' => $post->id,
        //         'image_path' => $path
        //     ]);
        // }

        // Uncomment later
        // Project::whereId($project->id)->delete();    

        return Inertia::render('community/profile', ['user' => Auth::user()->load(['projects'])])->with('sucess', 'Project published succesfully!');
    }

    public function destroy(Project $project)
    {
        $project->delete();

        return Inertia::render('home');
    }
}
