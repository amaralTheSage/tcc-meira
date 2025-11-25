<?php

use App\Events\CursorMoved;
use App\Http\Controllers\ConnectionsController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\ColumnController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskUserController;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Task;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/search-users', [UserController::class, 'search_user'])->middleware('auth')->name('users.search');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('/home', [ProjectController::class, 'index'])->name('home');

    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');

    // Adicionar middleware que confere se o usuário é membro do projeto
    Route::prefix('/{project}')->group(function () {

        Route::get('/traceboard', [TaskController::class, 'index'])->name('traceboard');

        Route::post('/traceboard/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::delete('/delete-task/{task_id}', [TaskController::class, 'destroy'])->name('tasks.destroy');
        Route::patch('/update-task/{task}', [TaskController::class, 'update'])->name('tasks.update');
        Route::patch('/move-task/{task}', [TaskController::class, 'move'])->name('tasks.move');

        Route::post('/connect', [ConnectionsController::class, 'connect'])->name('tasks.connect');
        Route::post('/disconnect', [ConnectionsController::class, 'disconnect'])->name('tasks.disconnect');

        // Notes
        Route::post('/traceboard/notes', [NoteController::class, 'store'])->name('notes.store');
        Route::delete('/delete-note/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
        Route::patch('/update-note/{note}', [NoteController::class, 'update'])->name('notes.update');
        Route::patch('/move-note/{note}', [NoteController::class, 'move'])->name('notes.move');

        Route::post('/cursor', function () {
            broadcast(new CursorMoved(request()->x, request()->y, request()->user()->id))->toOthers();
        })->name('cursor');

        // ROTA DE DESENVOLVIMENTO
        Route::get('/deletar-tasks', function (Project $project) {
            Task::whereProjectId($project->id)->delete();

            return back();
        });


        // ----------------------------------------------------------------------------------------------------------
        // Kanban

        Route::get('/kanban', [ColumnController::class, 'index'])->name('kanban');

        // COLUMNS
        Route::post('/kanban/column', [ColumnController::class, 'store'])->name('column.store');
        Route::patch('/column/update/{column}', [ColumnController::class, 'update'])->name('column.update');
        Route::patch('/kanban/columns/reorder', [ColumnController::class, 'reorder'])->name('column.reorder');
        Route::delete('/column/delete/{column}', [ColumnController::class, 'destroy'])->name('column.destroy');

        // SUBTASKS
        Route::post('/kanban/subtasks', [SubtaskController::class, 'store'])->name('subtasks.store');
        Route::delete('/delete-subtask/{subtask_id}', [SubtaskController::class, 'destroy'])->name('subtasks.destroy');
        Route::patch('/update-subtask/{subtask}', [SubtaskController::class, 'update'])->name('subtasks.update');

        // TASK USERS

        // TASK IMAGES
        Route::post('/kanban/tasks/{task}/upload-image', [TaskController::class, 'uploadImage'])->name('tasks.upload-image');
        Route::post('/kanban/tasks/{task}/users', [TaskUserController::class, 'attach'])->name('tasks.users.attach');
        Route::delete('/kanban/tasks/{task}/users/{user}', [TaskUserController::class, 'detach'])->name('tasks.users.detach');

        // ----------------------------------------------------------------------------------------------------------
        // PINS
        Route::get('/pins', [PinController::class, 'index'])->name('pins');
        Route::post('/pins', [PinController::class, 'store'])->name('pins.store');
        Route::patch('/pins/move/{pin}', [PinController::class, 'move'])->name('pins.move');
        Route::delete('/pins/{pin}', [PinController::class, 'destroy'])->name('pins.destroy');
        // ----------------------------------------------------------------------------------------------------------

        Route::get('/team-chat', function (Project $project) {
            return Inertia::render('project/team-chat', ['project' => $project]);
        })->name('team-chat');

        Route::get('/project-settings', [ProjectController::class, 'edit'])->name('project-settings');
        Route::patch('/project-settings', [ProjectController::class, 'update'])->name('projects.update');

        // -------------------------------------------------------------------------------------------------------
        // Docs

        Route::get('/docs', function (Project $project) {
            return Inertia::render('project/docs', ['project' => $project]);
        })->name('docs');


        // ----------------------------------------------------------------------------------------------------------
        // Publish And Delete
        Route::get('/publish', [ProjectController::class, 'publishing_form'])->name('project.publishing_form');

        Route::post('/publish', [ProjectController::class, 'publish'])->name('project.publish');

        Route::delete('/delete', [ProjectController::class, 'destroy'])->name('project.destroy');

        // TAGS
        Route::resource('/tags', TagController::class)->except(['create', 'edit', 'show']);
        Route::post('/apply-tag', [TagController::class, 'apply_tag'])->name('tags.apply-tag');
        Route::post('/detach-tag', [TagController::class, 'detach_tag'])->name('tags.detach-tag');
    });

    Route::prefix('/community')->group(function () {
        Route::get('/', [CommunityController::class, 'feed'])->name('community.feed');

        Route::get('/profile/{user}',  [CommunityController::class, 'profile'])->name('community.profile');
    });


    // Templates
    Route::prefix('/templates/{template}')->group(function () {
        Route::redirect('/', '/templates/{template}/traceboard');


        Route::get('/traceboard', function (ProjectTemplate $template) {
            return Inertia::render('template-visualizing/traceboard', ['template' => $template]);
        });

        Route::get('/kanban', function (ProjectTemplate $template) {
            return Inertia::render('template-visualizing/kanban', ['template' => $template]);
        });

        Route::get('/pins', function (ProjectTemplate $template) {
            return Inertia::render('template-visualizing/pins', ['template' => $template]);
        });

        Route::post('/apply', [ProjectController::class, 'apply_template'])->name('project.apply_template');
    });

    // ----------------------------------------------------------------------------------------------------------
    // Friendships

    Route::post('/friends/{friend}', [UserController::class, 'accept_friendship'])->name('accept_friendship');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
