<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('tasks', function () {
    return Auth::check();
});

Broadcast::channel('cursor', function () {
    return Auth::check();
});

Broadcast::channel('columns', function (){
    return Auth::check();
});

Broadcast::channel('subtasks', function (){
    return Auth::check();
});

Broadcast::channel('tasks_users', function (){
    return Auth::check();
});

Broadcast::channel('subtasks_users', function (){
    return Auth::check();
});

Broadcast::channel('private-chat', function (){
    return Auth::check();
});