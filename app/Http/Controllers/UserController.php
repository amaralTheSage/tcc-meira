<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Attach a friend to the authenticated user.
     *
     * Example: POST /friends/{friend}.
     */
    public function acceptFriendship(User $friend): RedirectResponse
    {
        $user = Auth::user();

        $isAlreadyFriend = $user->friends()->where('users.id', $friend->id)->exists();

        if ($friend->id === $user->id || $isAlreadyFriend) {
            return back()->with('message', "Cannot befriend yourself or someone that's already a friend");
        }

        $user->friends()->attach($friend->id);

        return back();
    }

    /**
     * Search users by name or email for project invitations.
     *
     * Example: GET /search-users?search=ana.
     */
    public function searchUsers(Request $request): Response
    {
        $users = User::query()
            ->when(
                $request->search,
                fn ($q, $s) => $q->where('name', 'ilike', "%$s%")
                    ->orWhere('email', 'ilike', "%$s%")
            )
            ->limit(20)
            ->get();

        return inertia('home', [
            'users' => $users,
        ]);
    }
}
