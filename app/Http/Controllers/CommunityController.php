<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    /**
     * Render the public community feed.
     *
     * Example: GET /community.
     */
    public function feed(): Response
    {
        return Inertia::render('community/feed');
    }

    /**
     * Render a public community profile.
     *
     * Example: GET /community/profile/{user}.
     */
    public function profile(User $user): Response
    {
        return Inertia::render('community/profile', ['user' => $user->load(['projects', 'posts', 'templates'])]);
    }
}
