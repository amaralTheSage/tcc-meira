<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CommunityController extends Controller
{
    public function feed(){
        return Inertia::render('community/feed');
    }

    public function profile(User $user){
        return Inertia::render('community/profile', ['projects' => $user.projects()]);
    }
}
