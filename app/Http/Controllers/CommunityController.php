<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Str;

class CommunityController extends Controller
{
    public function feed(){
        return Inertia::render('community/feed');
    }

    public function profile(User $user){
        return Inertia::render('community/profile', ['user' => $user->load(['projects'])]);
    }

    public function store(Project $project, Request $request){
        dd($request->images);


        // # to-do: validate better
        // $validated = $request->validate(['title'=>'required','description'=>'required|min:200']);

        // $post = CommunityPost::create($validated);

        // $post->members->attach($project->members);

        // $img_array = [];

        // foreach ($request->images as $image) {
        //     # Gera um caminho como posts/[post]-[img-uuid]

        //     $uuid = Str::uuid();

        //     $imagePath = Storage::disk('public')->putFile('posts/',  $post->id.'-'. $uuid);
        //     // $updates['image'] = asset(Storage::url($imagePath));
            
        //     array_push($img_array, $uuid);
        // }
  
    
        // return Inertia::render('community/profile', ['user' => Auth::user()->load(['projects'])])->with('sucess', 'Project published succesfully!');
    }
}
