<?php

use App\Enums\ColumnType;
use App\Enums\NotificationType;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use App\Notifications\ProjectInvite;
use App\Services\NotificationService;
use App\Services\Projects\ProjectPublisher;
use App\Services\Projects\ProjectTemplateApplier;
use App\Services\Projects\ProjectTemplatePayloadBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Tests\Support\BackendFixtures as Backend;

uses(RefreshDatabase::class);

it('creates project defaults for columns and chat', function () {
    $project = Project::factory()->create();

    expect($project->id)->not->toBeEmpty();
    expect($project->columns()->count())->toBe(4);
    expect($project->chat()->exists())->toBeTrue();
    expect($project->columns()->pluck('type')->all())->toEqual([
        ColumnType::BACKLOG->value,
        ColumnType::TODO->value,
        ColumnType::IN_PROGRESS->value,
        ColumnType::DONE->value,
    ]);
});

it('connects core model relationships through factories and pivots', function () {
    [$user, $project] = Backend::projectWithMember();
    $task = Backend::task($project);
    $subtask = Backend::subtask($task);
    $tag = Backend::tag($project);

    $task->tags()->attach($tag);
    $task->users()->attach($user);

    expect($project->tasks()->whereKey($task->id)->exists())->toBeTrue();
    expect($task->subtasks()->whereKey($subtask->id)->exists())->toBeTrue();
    expect($task->tags()->whereKey($tag->id)->exists())->toBeTrue();
    expect($user->tasks()->whereKey($task->id)->exists())->toBeTrue();
});

it('casts project template data to arrays', function () {
    $template = Backend::projectTemplate(null, [
        'data' => ['columns' => [], 'tasks' => [], 'pins' => [], 'notes' => [], 'task_connections' => []],
    ]);

    expect($template->fresh()->data)->toBeArray();
});

it('builds project template payloads from ordered project resources', function () {
    [$user, $project] = Backend::projectWithMember();
    $firstTask = Backend::task($project, ['id' => 'task-1', 'position' => 1]);
    $secondTask = Backend::task($project, ['id' => 'task-2', 'position' => 2]);
    Backend::subtask($firstTask, ['title' => 'Child']);
    Backend::pin($project, ['title' => 'Spec', 'position' => 1]);
    Backend::note($project, ['text' => 'Note']);
    DB::table('task_connections')->insert([
        'source_id' => $firstTask->id,
        'target_id' => $secondTask->id,
    ]);

    $payload = app(ProjectTemplatePayloadBuilder::class)->build($project);

    expect($payload['columns'])->toHaveCount(4);
    expect($payload['tasks'][0]['id'])->toBe('task-1');
    expect($payload['tasks'][0]['subtasks'][0]['title'])->toBe('Child');
    expect($payload['pins'][0]['title'])->toBe('Spec');
    expect($payload['notes'][0]['text'])->toBe('Note');
    expect($payload['task_connections'][0]->source_id)->toBe('task-1');
});

it('publishes projects and creates optional templates', function () {
    [$user, $project] = Backend::projectWithMember();
    $collaborator = Backend::projectMember($project);
    $publisher = new ProjectPublisher(app(ProjectTemplatePayloadBuilder::class));

    $post = $publisher->publish($project, [
        'title' => 'Publishable',
        'description' => Backend::publishDescription(),
        'create_template' => true,
        'images' => ['cover.png'],
    ], $user);

    expect($post)->toBeInstanceOf(CommunityPost::class);
    expect($post->members()->pluck('users.id')->all())
        ->toEqualCanonicalizing([$user->id, $collaborator->id]);
    expect(ProjectTemplate::where('project_id', $project->id)->exists())->toBeTrue();
});

it('applies project templates into project copies', function () {
    $user = User::factory()->create();
    $template = Backend::projectTemplate($user, [
        'name' => 'DeployFlow',
        'data' => deployTemplatePayload(),
    ]);

    $project = app(ProjectTemplateApplier::class)->apply($template, $user);

    expect($project->title)->toBe('DeployFlow Copy');
    expect($project->members()->whereKey($user->id)->exists())->toBeTrue();
    expect($project->tasks()->where('title', 'Ship')->exists())->toBeTrue();
    expect($project->notes()->where('text', 'Coordinate')->exists())->toBeTrue();
    expect($project->pins()->where('title', 'Runbook')->exists())->toBeTrue();
});

it('maps template task column ids to cloned project columns', function () {
    $user = User::factory()->create();
    $payload = deployTemplatePayload();
    $payload['columns'][0]['id'] = 'template-backlog';
    $payload['tasks'][0]['column_id'] = 'template-backlog';
    $template = Backend::projectTemplate($user, ['name' => 'ColumnMap', 'data' => $payload]);

    $project = app(ProjectTemplateApplier::class)->apply($template, $user);
    $task = $project->tasks()->firstOrFail();

    expect($project->columns()->whereKey($task->column_id)->exists())->toBeTrue();
});

it('sends typed project invite notifications', function () {
    Notification::fake();
    $user = User::factory()->create();

    app(NotificationService::class)->toOne($user, NotificationType::PROJECT_INVITE, [
        'projectName' => 'Meira',
        'confirmationUrl' => '/friends/'.$user->id,
    ]);

    Notification::assertSentTo($user, ProjectInvite::class, function (ProjectInvite $notification) use ($user) {
        return $notification->toArray($user)['type'] === NotificationType::PROJECT_INVITE->value;
    });
});

it('serializes project invite notifications for mail and arrays', function () {
    $user = User::factory()->create();
    $notification = new ProjectInvite([
        'userId' => (string) $user->id,
        'projectName' => 'Meira',
        'confirmationUrl' => '/friends/'.$user->id,
        'type' => NotificationType::PROJECT_INVITE->value,
    ]);

    expect($notification->via($user))->toBe(['mail']);
    expect($notification->toArray($user))->toMatchArray([
        'userId' => (string) $user->id,
        'projectName' => 'Meira',
    ]);
});

function deployTemplatePayload(): array
{
    return [
        'columns' => [['name' => 'Backlog', 'position' => 0, 'type' => ColumnType::BACKLOG->value]],
        'tasks' => [[
            'id' => 'template-task',
            'title' => 'Ship',
            'description' => 'Deploy safely',
            'image' => null,
            'position' => 0,
            'x' => 10,
            'y' => 20,
            'subtasks' => [['title' => 'Review', 'position' => 0, 'completed' => false]],
        ]],
        'task_connections' => [],
        'notes' => [['text' => 'Coordinate', 'x' => 1, 'y' => 2]],
        'pins' => [['title' => 'Runbook', 'url' => 'https://example.test', 'text' => null, 'position' => 0]],
    ];
}
