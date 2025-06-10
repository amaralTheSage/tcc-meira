<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('canvas', function ($user, $id) {
    return auth()->checkf();
});
