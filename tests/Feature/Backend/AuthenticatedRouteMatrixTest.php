<?php

use App\Enums\ColumnType;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Tests\Support\BackendFixtures as Backend;

it('redirects guests away from every authenticated backend route', function (Closure $case) {
    [$method, $uri, $payload] = $case();

    $this->{$method}($uri, $payload)->assertRedirect('/login');
})->with('authenticated backend routes');

it('forbids non members from project scoped backend routes', function (Closure $case) {
    [$method, $uri, $payload] = $case();
    $outsider = User::factory()->create();
    Event::fake();

    $this->actingAs($outsider)
        ->{$method}($uri, $payload)
        ->assertForbidden();
})->with('project scoped backend routes');

dataset('authenticated backend routes', [
    'home' => fn () => ['get', route('home'), []],
    'logout' => fn () => ['post', route('logout'), []],
    'project store' => fn () => ['post', route('projects.store'), ['title' => 'New Project']],
    'user search' => fn () => ['get', route('users.search', ['search' => 'ana']), []],
    'profile edit' => fn () => ['get', route('profile.edit'), []],
    'profile update' => fn () => ['patch', route('profile.update'), ['name' => 'Updated']],
    'profile delete' => fn () => ['delete', route('profile.destroy'), []],
    'appearance' => fn () => ['get', route('appearance'), []],
    'shared project copy' => fn () => sharedProjectCopyCase(),
    'template traceboard' => fn () => ['get', '/templates/'.Backend::projectTemplate()->id.'/traceboard', []],
    'template kanban' => fn () => ['get', '/templates/'.Backend::projectTemplate()->id.'/kanban', []],
    'template pins' => fn () => ['get', '/templates/'.Backend::projectTemplate()->id.'/pins', []],
    'template apply' => fn () => ['post', route('project.apply_template', Backend::projectTemplate()), []],
    'sprint attach tasks' => function () {
        $project = Project::factory()->create();
        $sprint = Backend::sprint($project);
        $task = Backend::task($project);

        return ['post', route('sprint.attach-tasks', $sprint), ['task_ids' => [$task->id]]];
    },
    'sprint start' => function () {
        $project = Project::factory()->create();

        return ['patch', route('sprint.start', Backend::sprint($project)), []];
    },
    'sprint complete' => function () {
        $project = Project::factory()->create();

        return ['patch', route('sprint.complete', Backend::sprint($project)), []];
    },
    ...projectRouteCases(),
]);

dataset('project scoped backend routes', projectRouteCases());

function projectRouteCases(): array
{
    return [
        'traceboard page' => fn () => projectPageCase('get', 'traceboard'),
        'project undo' => fn () => projectPageCase('post', 'project.undo'),
        'task store' => fn () => taskStoreCase(),
        'task update' => fn () => taskCase('patch', 'tasks.update', ['title' => 'Renamed']),
        'task move' => fn () => taskCase('patch', 'tasks.move', ['x' => 50, 'y' => 75]),
        'task complete' => fn () => taskCase('patch', 'tasks.complete'),
        'task reorder' => fn () => taskReorderCase(),
        'task delete' => fn () => taskDeleteCase(),
        'connect tasks' => fn () => connectionCase('tasks.connect'),
        'disconnect tasks' => fn () => connectionCase('tasks.disconnect'),
        'note store' => fn () => noteStoreCase(),
        'note update' => fn () => noteCase('patch', 'notes.update', ['text' => 'Updated']),
        'note move' => fn () => noteCase('patch', 'notes.move', ['x' => 80, 'y' => 90]),
        'note delete' => fn () => noteCase('delete', 'notes.destroy'),
        'cursor store' => fn () => projectPageCase('post', 'cursor', ['x' => 12, 'y' => 24]),
        'kanban page' => fn () => projectPageCase('get', 'kanban'),
        'column store' => fn () => projectPageCase('post', 'column.store', ['position' => 9]),
        'column update' => fn () => columnCase('patch', 'column.update', ['name' => 'Next']),
        'column reorder' => fn () => columnReorderCase(),
        'column delete' => fn () => columnCase('delete', 'column.destroy'),
        'subtask store' => fn () => subtaskStoreCase(),
        'subtask update' => fn () => subtaskCase('patch', 'subtasks.update', ['completed' => true]),
        'subtask delete' => fn () => subtaskCase('delete', 'subtasks.destroy'),
        'subtask user attach' => fn () => subtaskUserCase('post', 'subtasks.users.attach'),
        'subtask user detach' => fn () => subtaskUserCase('delete', 'subtasks.users.detach'),
        'task user attach' => fn () => taskUserCase('post', 'tasks.users.attach'),
        'task user detach' => fn () => taskUserCase('delete', 'tasks.users.detach'),
        'sprint page' => fn () => projectPageCase('get', 'sprint.index'),
        'sprint store' => fn () => sprintStoreCase(),
        'sprint update' => fn () => sprintCase('patch', 'sprint.update'),
        'sprint delete' => fn () => sprintCase('delete', 'sprint.destroy'),
        'pins page' => fn () => projectPageCase('get', 'pins'),
        'pin store' => fn () => pinStoreCase(),
        'pin move' => fn () => pinCase('patch', 'pins.move', ['position' => 3]),
        'pin reorder' => fn () => pinReorderCase(),
        'pin delete' => fn () => pinCase('delete', 'pins.destroy'),
        'team chat page' => fn () => projectPageCase('get', 'team-chat'),
        'message store' => fn () => messageStoreCase(),
        'project settings page' => fn () => projectPageCase('get', 'project-settings'),
        'project settings update' => fn () => projectPageCase('patch', 'projects.update', ['edge_type' => 'step']),
        'project member search' => fn () => projectPageCase('get', 'project-members.search', ['search' => 'ana']),
        'project member invite' => fn () => projectMemberInviteCase(),
        'project member destroy' => fn () => projectMemberDestroyCase(),
        'docs page' => fn () => projectPageCase('get', 'docs'),
        'docs show' => fn () => documentCase('get', 'docs.show'),
        'docs store' => fn () => projectPageCase('post', 'docs.store', ['title' => 'Runbook']),
        'docs rename' => fn () => documentCase('patch', 'docs.update', ['title' => 'Renamed']),
        'docs content update' => fn () => documentContentCase(),
        'docs asset store' => fn () => documentAssetCase(),
        'docs delete' => fn () => documentCase('delete', 'docs.destroy'),
        'publish page' => fn () => projectPageCase('get', 'project.publishing_form'),
        'publish submit' => fn () => publishCase(),
        'project delete' => fn () => projectPageCase('delete', 'project.destroy'),
        'tag store' => fn () => projectPageCase('post', 'tags.store', ['name' => 'Risk', 'color' => '#ff0011']),
        'tag update' => fn () => tagCase('patch', 'tags.update', ['name' => 'Done', 'color' => '#00ffaa']),
        'tag delete' => fn () => tagCase('delete', 'tags.destroy'),
        'tag apply' => fn () => taskTagCase('tags.apply-tag'),
        'tag detach' => fn () => taskTagCase('tags.detach-tag'),
    ];
}

function projectPageCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();

    return [$method, route($route, $project), $payload];
}

function projectMemberInviteCase(): array
{
    $project = Project::factory()->create();
    $invitee = User::factory()->create();

    return ['post', route('project-members.invite', $project), ['user_id' => $invitee->id]];
}

function projectMemberDestroyCase(): array
{
    $project = Project::factory()->create();
    $member = User::factory()->create();

    return ['delete', route('project-members.destroy', [$project, $member]), []];
}

function taskStoreCase(): array
{
    $project = Project::factory()->create();

    return ['post', route('tasks.store', $project), ['id' => 'task-new', 'x' => 10, 'y' => 20]];
}

function taskCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $task = Backend::task($project);

    return [$method, route($route, [$project, $task]), $payload];
}

function taskDeleteCase(): array
{
    $project = Project::factory()->create();
    $task = Backend::task($project);

    return ['delete', route('tasks.destroy', [$project, $task->id]), []];
}

function taskReorderCase(): array
{
    $project = Project::factory()->create();
    $task = Backend::task($project);

    return ['patch', route('tasks.reorder', $project), [
        'tasks' => [['id' => $task->id, 'position' => 2]],
    ]];
}

function connectionCase(string $route): array
{
    $project = Project::factory()->create();
    $source = Backend::task($project, ['id' => 'source-task']);
    $target = Backend::task($project, ['id' => 'target-task']);

    return [$route === 'tasks.connect' ? 'post' : 'post', route($route, $project), [
        'source_id' => $source->id,
        'target_id' => $target->id,
    ]];
}

function noteStoreCase(): array
{
    $project = Project::factory()->create();

    return ['post', route('notes.store', $project), ['id' => 'note-new', 'x' => 10, 'y' => 20]];
}

function noteCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $note = Backend::note($project);

    return [$method, route($route, [$project, $note]), $payload];
}

function columnCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $column = Backend::defaultColumn($project, ColumnType::TODO);

    return [$method, route($route, [$project, $column]), $payload];
}

function columnReorderCase(): array
{
    $project = Project::factory()->create();
    $column = Backend::defaultColumn($project, ColumnType::TODO);

    return ['patch', route('column.reorder', $project), [
        'columns' => [['id' => $column->id, 'position' => 5]],
    ]];
}

function subtaskStoreCase(): array
{
    $project = Project::factory()->create();
    $task = Backend::task($project);

    return ['post', route('subtasks.store', $project), [
        'title' => 'Write copy',
        'task_id' => $task->id,
    ]];
}

function subtaskCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $subtask = Backend::subtask(Backend::task($project));

    return [$method, route($route, [$project, $subtask->id]), $payload];
}

function subtaskUserCase(string $method, string $route): array
{
    $project = Project::factory()->create();
    $user = Backend::projectMember($project);
    $subtask = Backend::subtask(Backend::task($project));

    return [$method, route($route, [$project, $subtask, $user]), ['user_id' => $user->id]];
}

function taskUserCase(string $method, string $route): array
{
    $project = Project::factory()->create();
    $user = Backend::projectMember($project);
    $task = Backend::task($project);

    return [$method, route($route, [$project, $task, $user]), ['user_id' => $user->id]];
}

function sprintStoreCase(): array
{
    $project = Project::factory()->create();

    return ['post', route('sprint.store', $project), [
        'title' => 'Sprint 1',
        'start_at' => now()->format('Y-m-d'),
        'end_at' => now()->addWeek()->format('Y-m-d'),
    ]];
}

function sprintCase(string $method, string $route): array
{
    $project = Project::factory()->create();
    $sprint = Backend::sprint($project);

    return [$method, route($route, [$project, $sprint]), [
        'title' => 'Sprint 2',
        'start_at' => now()->format('Y-m-d'),
        'end_at' => now()->addWeek()->format('Y-m-d'),
    ]];
}

function pinStoreCase(): array
{
    $project = Project::factory()->create();

    return ['post', route('pins.store', $project), [
        'type' => 'text',
        'text' => 'Pinned note',
        'position' => 1,
    ]];
}

function pinCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $pin = Backend::pin($project);

    return [$method, route($route, [$project, $pin]), $payload];
}

function pinReorderCase(): array
{
    $project = Project::factory()->create();
    $pin = Backend::pin($project);

    return ['patch', route('pins.reorder', $project), [
        'pins' => [['id' => $pin->id, 'position' => 2]],
    ]];
}

function messageStoreCase(): array
{
    $project = Project::factory()->create();
    $user = Backend::projectMember($project);

    return ['post', route('message.store', $project), [
        'chat_id' => Backend::chat($project)->id,
        'user_id' => $user->id,
        'content' => 'Hello',
    ]];
}

function documentCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $document = Backend::document($project);

    return [$method, route($route, [$project, $document]), $payload];
}

function documentContentCase(): array
{
    $project = Project::factory()->create();
    $document = Backend::document($project);

    return ['patch', route('docs.content.update', [$project, $document]), [
        'markdown' => '# Updated',
        'base_version' => $document->version,
    ]];
}

function documentAssetCase(): array
{
    $project = Project::factory()->create();
    $document = Backend::document($project);

    return ['post', route('docs.assets.store', [$project, $document]), [
        'file' => UploadedFile::fake()->create('diagram.png', 4, 'image/png'),
    ]];
}

function publishCase(): array
{
    $project = Project::factory()->create();

    return ['post', route('project.publish', $project), [
        'title' => 'Published Project',
        'description' => Backend::publishDescription(),
        'images' => ['cover.png'],
    ]];
}

function sharedProjectCopyCase(): array
{
    $project = Project::factory()->create([
        'visibility' => 'public',
        'share_token' => 'copy-auth-route-token',
        'published_at' => now(),
    ]);

    return ['post', route('shared.copy', $project->share_token), []];
}

function tagCase(string $method, string $route, array $payload = []): array
{
    $project = Project::factory()->create();
    $tag = Backend::tag($project);

    return [$method, route($route, [$project, $tag->id]), $payload];
}

function taskTagCase(string $route): array
{
    $project = Project::factory()->create();
    $task = Backend::task($project);
    $tag = Backend::tag($project);

    return ['post', route($route, $project), ['task_id' => $task->id, 'tag_id' => (string) $tag->id]];
}
