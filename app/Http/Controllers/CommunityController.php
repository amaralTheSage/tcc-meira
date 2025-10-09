<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CommunityController extends Controller
{
    public function feed(){
        return Inertia::render('community/feed');
    }

    public function profile(User $user){
        return Inertia::render('community/profile', ['user' => $user->load(['projects'])]);
    }

    public function store(Project $project, Request $request){

        $validated = $request->validate(['title'=>'required','description'=>'required|min:200']);

        $post = CommunityPost::create($validated);

        $post->members->attach($project->members);

        


    }
}
