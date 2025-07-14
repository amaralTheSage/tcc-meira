<?php

use App\Http\Controllers\ConnectionsController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::get('/colors', function(){
    return Inertia::render('color-page');
});

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('/home', [ProjectController::class, 'index'])->name('home');

    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');

    // Adicionar middleware que confere se o usuário é membro do projeto
    Route::prefix('/{project}')->group(function () {
        Route::get('/traceboard', [TaskController::class, 'index'])->name('traceboard');

        Route::post('/traceboard', [TaskController::class, 'store'])->name('tasks.store');
        Route::delete('/delete-task/{task_id}', [TaskController::class, 'destroy'])->name('tasks.destroy');
        Route::patch('/update-task/{task}', [TaskController::class, 'update'])->name('tasks.update');

        Route::post('/connect', [ConnectionsController::class, 'connect'])->name('tasks.connect');
        Route::post('/disconnect', [ConnectionsController::class, 'disconnect'])->name('tasks.disconnect');

        // ROTA DE DESENVOLVIMENTO
        Route::get('/deletar-tasks', function (Project $project) {
            Task::whereProjectId($project->id)->delete();

            return back();
        });
        //

        Route::get('/kanban', function (Project $project) {
            return Inertia::render('project/kanban', ['project' => $project]);
        })->name('kanban');


        // ----------------------------------------------------------------------------------------------------------
        // PINS
        Route::get('/pins', [PinController::class, 'index'])->name('pins');
        Route::post('/pins', [PinController::class, 'store'])->name('pins.store');
        Route::patch('/pins/move/{pin}', [PinController::class,'move'])->name('pins.move');
        Route::delete('/pins/{pin}', [PinController::class, 'destroy'])->name('pins.destroy');
        // ----------------------------------------------------------------------------------------------------------

        Route::get('/team-chat', function (Project $project) {
            return Inertia::render('project/team-chat', ['project' => $project]);
        })->name('team-chat');

        Route::get('/project-settings', function (Project $project) {
            return Inertia::render('project/project-settings', ['project' => $project]);
        })->name('project-settings');
    });

    Route::prefix('/community')->group(function () {
        Route::get('/', function (Project $project) {
            return Inertia::render('community/feed');
        })->name('community.index');

        Route::get('/profile', function (Project $project) {
            return Inertia::render('community/profile');
        })->name('community.');
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
