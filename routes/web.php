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
    Route::get('/intersection', function(){
        return Inertia::render('intersection', [
            #'projects' => auth()->user()->projects,
            'projects' => Project::get()
        ]);
    })->name('intersection');

     Route::get('/{project}/traceboard', [TaskController::class, 'index'])->name('traceboard');
});



require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
