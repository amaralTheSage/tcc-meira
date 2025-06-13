<?php

use App\Http\Controllers\TaskController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('/intersection', function () {
        return Inertia::render('intersection', [
            'projects' => Project::get(),
        ]);
    })->name('intersection');

    Route::delete('/delete-task/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
    Route::patch("/update-task/{task}", [TaskController::class, 'update'])->name('tasks.update');

    Route::prefix('/{project}')->group(function () {
        Route::get('/traceboard', [TaskController::class, 'index'])->name('traceboard');
        Route::post('/traceboard', [TaskController::class, 'store'])->name('tasks.store');

        Route::get('/kanban', function (Project $project) {
            return Inertia::render('project/kanban', ['project' => $project]);
        })->name('kanban');

        Route::get('/pins', function (Project $project) {
            return Inertia::render('project/pins', ['project' => $project]);
        })->name('pins');

        Route::get('/team-chat', function (Project $project) {
            return Inertia::render('project/team-chat', ['project' => $project]);
        })->name('team-chat');

        Route::get('/project-settings', function (Project $project) {
            return Inertia::render('project/project-settings', ['project' => $project]);
        })->name('project-settings');
    });

    Route::prefix('/community')->group(function(){
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
