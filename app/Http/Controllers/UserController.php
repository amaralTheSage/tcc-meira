<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function accept_friendship(User $friend){
        $user = Auth::user();    
        
        $isAlreadyFriend = $user->friends()->where('users.id', $friend->id)->exists();

        if($friend->id === $user->id || $isAlreadyFriend ){
            return back()->with('message', "Cannot befriend yourself or someone that's already a friend");
        }
        
        $user->friends()->attach($friend->id);
        
        return back();
    }
}
