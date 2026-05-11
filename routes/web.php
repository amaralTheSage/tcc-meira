<?php

use App\Http\Controllers\ChatController;
use App\Http\Controllers\ColumnController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\ConnectionsController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PinController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectCursorController;
use App\Http\Controllers\ProjectDocsController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectUndoController;
use App\Http\Controllers\SharedProjectController;
use App\Http\Controllers\SprintController;
use App\Http\Controllers\SubtaskController;
use App\Http\Controllers\SubtaskUserController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskReorderController;
use App\Http\Controllers\TaskUserController;
use App\Http\Controllers\TemplatePreviewController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;
use Laravel\WorkOS\Http\Middleware\ValidateSessionWithWorkOS;

Route::get('/', WelcomeController::class)->name('welcome');

Route::get('/search-users', [UserController::class, 'searchUsers'])->middleware('auth')->name('users.search');

Route::prefix('/community')->group(function () {
    Route::get('/', [CommunityController::class, 'feed'])->name('community.feed');
    Route::get('/profile/{user}', [CommunityController::class, 'profile'])->name('community.profile');
});

Route::prefix('/p/{shareToken}')->group(function () {
    Route::get('/', [SharedProjectController::class, 'show'])->name('shared.show');
    Route::get('/traceboard', [SharedProjectController::class, 'traceboard'])->name('shared.traceboard');
    Route::get('/kanban', [SharedProjectController::class, 'kanban'])->name('shared.kanban');
    Route::get('/pins', [SharedProjectController::class, 'pins'])->name('shared.pins');
    Route::get('/docs', [SharedProjectController::class, 'docs'])->name('shared.docs');
    Route::get('/export', [SharedProjectController::class, 'export'])->name('shared.export');
});

Route::middleware([
    'auth',
    ValidateSessionWithWorkOS::class,
])->group(function () {
    Route::get('/home', [ProjectController::class, 'index'])->name('home');

    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::post('/p/{shareToken}/copy', [SharedProjectController::class, 'copy'])->name('shared.copy');
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/project-invitations/{invitation}/accept', [ProjectInvitationController::class, 'accept'])->name('project-invitations.accept');
    Route::post('/project-invitations/{invitation}/decline', [ProjectInvitationController::class, 'decline'])->name('project-invitations.decline');

    // Adicionar middleware que confere se o usuário é membro do projeto
    Route::prefix('/{project}')->middleware('project.member')->group(function () {

        Route::get('/traceboard', [TaskController::class, 'index'])->name('traceboard');
        Route::post('/undo', [ProjectUndoController::class, 'store'])->name('project.undo');

        Route::post('/traceboard/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::delete('/delete-task/{task_id}', [TaskController::class, 'destroy'])->name('tasks.destroy');
        Route::patch('/update-task/{task}', [TaskController::class, 'update'])->name('tasks.update');
        Route::patch('/move-task/{task}', [TaskController::class, 'move'])->name('tasks.move');
        Route::patch('/complete-task/{task}', [TaskController::class, 'complete'])->name('tasks.complete');
        Route::patch('/kanban/tasks/reorder', TaskReorderController::class)->name('tasks.reorder');

        Route::post('/connect', [ConnectionsController::class, 'connect'])->name('tasks.connect');
        Route::post('/disconnect', [ConnectionsController::class, 'disconnect'])->name('tasks.disconnect');

        // Notes
        Route::post('/traceboard/notes', [NoteController::class, 'store'])->name('notes.store');
        Route::delete('/delete-note/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');
        Route::patch('/update-note/{note}', [NoteController::class, 'update'])->name('notes.update');
        Route::patch('/move-note/{note}', [NoteController::class, 'move'])->name('notes.move');

        Route::post('/cursor', [ProjectCursorController::class, 'store'])->name('cursor');

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
        Route::patch('/update-subtask/{subtask_id}', [SubtaskController::class, 'update'])->name('subtasks.update');

        Route::post('/kanban/subtasks/{subtask}/users', [SubtaskUserController::class, 'attach'])->name('subtasks.users.attach');
        Route::delete('/kanban/subtasks/{subtask}/users/{user}', [SubtaskUserController::class, 'detach'])->name('subtasks.users.detach');

        // TASK
        Route::post('/kanban/tasks/{task}/users', [TaskUserController::class, 'attach'])->name('tasks.users.attach');
        Route::delete('/kanban/tasks/{task}/users/{user}', [TaskUserController::class, 'detach'])->name('tasks.users.detach');

        // ----------------------------------------------------------------------------------------------------------
        // Sprint-planner
        Route::get('/sprint', [SprintController::class, 'index'])->name('sprint.index');
        Route::post('/sprint', [SprintController::class, 'store'])->name('sprint.store');
        Route::patch('/sprint/{sprint}', [SprintController::class, 'update'])->name('sprint.update');
        Route::delete('/sprint/{sprint}', [SprintController::class, 'destroy'])->name('sprint.destroy');

        // ----------------------------------------------------------------------------------------------------------
        // PINS
        Route::get('/pins', [PinController::class, 'index'])->name('pins');
        Route::post('/pins', [PinController::class, 'store'])->name('pins.store');
        Route::patch('/pins/move/{pin}', [PinController::class, 'move'])->name('pins.move');
        Route::patch('/pins/reorder', [PinController::class, 'reorder'])->name('pins.reorder');
        Route::delete('/pins/{pin}', [PinController::class, 'destroy'])->name('pins.destroy');
        // ----------------------------------------------------------------------------------------------------------

        Route::get('/team-chat', [ChatController::class, 'index'])->name('team-chat');

        Route::post('/team-chat/message', [MessageController::class, 'store'])->name('message.store');
        Route::patch('/team-chat/messages/{message}', [MessageController::class, 'update'])->name('message.update');
        Route::delete('/team-chat/messages/{message}', [MessageController::class, 'destroy'])->name('message.destroy');

        Route::get('/project-settings', [ProjectController::class, 'edit'])->name('project-settings');
        Route::patch('/project-settings', [ProjectController::class, 'update'])->name('projects.update');
        Route::get('/members/search', [ProjectMemberController::class, 'search'])->name('project-members.search');
        Route::post('/members/invitations', [ProjectMemberController::class, 'invite'])->name('project-members.invite');
        Route::delete('/members/{user}', [ProjectMemberController::class, 'destroy'])->name('project-members.destroy');

        // -------------------------------------------------------------------------------------------------------
        // Docs

        Route::get('/docs', [ProjectDocsController::class, 'show'])->name('docs');
        Route::post('/docs', [ProjectDocsController::class, 'store'])->name('docs.store');
        Route::get('/docs/{document}', [ProjectDocsController::class, 'show'])->name('docs.show');
        Route::patch('/docs/{document}', [ProjectDocsController::class, 'update'])->name('docs.update');
        Route::patch('/docs/{document}/content', [ProjectDocsController::class, 'updateContent'])->name('docs.content.update');
        Route::post('/docs/{document}/assets', [ProjectDocsController::class, 'storeAsset'])->name('docs.assets.store');
        Route::delete('/docs/{document}', [ProjectDocsController::class, 'destroy'])->name('docs.destroy');

        // ----------------------------------------------------------------------------------------------------------
        // Sharing And Delete
        Route::get('/publish', [ProjectController::class, 'publishingForm'])->name('project.publishing_form');

        Route::post('/publish', [ProjectController::class, 'publish'])->name('project.publish');

        Route::delete('/delete', [ProjectController::class, 'destroy'])->name('project.destroy');

        // TAGS
        Route::post('/tags', [TagController::class, 'store'])->name('tags.store');
        Route::patch('/tags/{tag}', [TagController::class, 'update'])->name('tags.update');
        Route::delete('/tags/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');
        Route::post('/apply-tag', [TagController::class, 'applyTag'])->name('tags.apply-tag');
        Route::post('/detach-tag', [TagController::class, 'detachTag'])->name('tags.detach-tag');
    });

    Route::middleware('sprint.project.member')->group(function () {
        Route::post('/sprints/{sprint}/attach-tasks', [SprintController::class, 'attachTasks'])->name('sprint.attach-tasks');
        Route::patch('/sprints/{sprint}/start', [SprintController::class, 'start'])->name('sprint.start');
        Route::patch('/sprints/{sprint}/complete', [SprintController::class, 'complete'])->name('sprint.complete');
    });

    Route::prefix('/templates/{template}')->group(function () {
        Route::redirect('/', '/templates/{template}/traceboard');

        Route::get('/traceboard', [TemplatePreviewController::class, 'traceboard']);
        Route::get('/kanban', [TemplatePreviewController::class, 'kanban']);
        Route::get('/pins', [TemplatePreviewController::class, 'pins']);
        Route::post('/apply', [ProjectController::class, 'applyTemplate'])->name('project.apply_template');
    });

});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
