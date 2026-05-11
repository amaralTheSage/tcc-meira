<?php

use App\Models\ProjectDocument;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('tasks', function () {
    return Auth::check();
});

Broadcast::channel('cursor', function () {
    return Auth::check();
});

Broadcast::channel('columns', function () {
    return Auth::check();
});

Broadcast::channel('project-board', function () {
    return Auth::check();
});

Broadcast::channel('subtasks', function () {
    return Auth::check();
});

Broadcast::channel('tasks_users', function () {
    return Auth::check();
});

Broadcast::channel('subtasks_users', function () {
    return Auth::check();
});

Broadcast::channel('private-chat', function () {
    return Auth::check();
});

Broadcast::channel('project.{project}.docs.{document}', function (User $user, string $project, string $document) {
    $isMember = $user->projects()->whereKey($project)->exists();
    $isProjectDocument = ProjectDocument::whereKey($document)->where('project_id', $project)->exists();

    if (! $isMember || ! $isProjectDocument) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar' => $user->avatar,
    ];
});

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id): bool {
    return $user->id === $id;
});
