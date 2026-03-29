<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;

class CommunityController extends Controller
{
    public function feed()
    {
        return Inertia::render('community/feed');
    }

    public function profile(User $user)
    {
        return Inertia::render('community/profile', ['user' => $user->load(['projects', 'posts', 'templates'])]);
    }
}
