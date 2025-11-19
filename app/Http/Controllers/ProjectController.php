<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\CommunityPosts;
use App\Models\Project;
use App\Models\User;
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
            'users'=> $users,
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

    public function publishing_form(Project $project){
        return Inertia::render('project/publish', ['project'=> $project->load('members')]);
    }

    public function publish(Project $project, Request $request){

        # to-do: validate better
        $validated = $request->validate(['title'=>'required','description'=>'required|min:200']);

        $post = CommunityPosts::create($validated);

        $post->members()->attach($project->members);

        foreach ($request->images as $image) {
            # Gera um caminho como posts/[post]-[img-uuid]

            $uuid = Str::uuid();

            Storage::disk('public')->putFile('posts/'. $post->id.'-'. $uuid,  $image);

            DB::table('image_post')->create(['post_id'=>$post->id, 'image_id'=> $uuid]);

            # Para encontrar o caminho:
            # posts/[post id]-[image id]
            # $imagePath = 'posts/'.$post->id.'/'.$image->id
        }

        return Inertia::render('community/profile', ['user' => Auth::user()->load(['projects'])])->with('sucess', 'Project published succesfully!');
    }

    public function destroy(Project $project){
        $project->delete();

        return Inertia::render('home');
    }
}
