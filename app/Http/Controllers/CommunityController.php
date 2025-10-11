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


}
