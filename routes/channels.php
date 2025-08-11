<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('tasks', function () {
    return Auth::check();
});

Broadcast::channel('cursor', function () {
    return Auth::check();
});