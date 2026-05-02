<?php

use App\Enums\ColumnType;
use App\Enums\NotificationType;
use App\Enums\ProjectInvitationStatus;
use App\Enums\ProjectVisibility;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\ProjectTemplate;
use App\Models\User;
use App\Notifications\ProjectActionNotification;
use App\Services\NotificationService;
use App\Services\Projects\ProjectPublisher;
use App\Services\Projects\ProjectTemplateApplier;
use App\Services\Projects\ProjectTemplatePayloadBuilder;
use App\Services\Projects\ProjectTemplatePayloadValidator;
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
    expect($project->documents()->where('title', 'Project Docs')->exists())->toBeTrue();
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
    $sprint = Backend::sprint($project, ['title' => 'Sprint One', 'color' => '#16a34a']);
    $firstTask = Backend::task($project, ['id' => 'task-1', 'position' => 1, 'sprint_id' => $sprint->id]);
    $secondTask = Backend::task($project, ['id' => 'task-2', 'position' => 2]);
    Backend::subtask($firstTask, ['title' => 'Child']);
    Backend::pin($project, ['title' => 'Spec', 'position' => 1]);
    Backend::note($project, ['text' => 'Note']);
    $project->documents()->delete();
    Backend::document($project, ['title' => 'Readme', 'markdown' => '# Readme']);
    DB::table('task_connections')->insert([
        'source_id' => $firstTask->id,
        'target_id' => $secondTask->id,
    ]);

    $payload = app(ProjectTemplatePayloadBuilder::class)->build($project);

    expect($payload['columns'])->toHaveCount(4);
    expect($payload['tasks'][0]['id'])->toBe('task-1');
    expect($payload['tasks'][0]['sprint_id'])->toBe($sprint->id);
    expect($payload['tasks'][0]['subtasks'][0]['title'])->toBe('Child');
    expect($payload['sprints'][0]['title'])->toBe('Sprint One');
    expect($payload['sprints'][0]['color'])->toBe('#16a34a');
    expect($payload['pins'][0]['title'])->toBe('Spec');
    expect($payload['notes'][0]['text'])->toBe('Note');
    expect($payload['documents'][0]['title'])->toBe('Readme');
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
    expect($project->fresh()->visibility)->toBe(ProjectVisibility::PUBLIC);
    expect($project->fresh()->share_token)->not->toBeNull();
    expect($post->images()->count())->toBe(1);
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
    expect($project->sprints()->where('title', 'Sprint One')->exists())->toBeTrue();
    expect($project->sprints()->whereKey($project->tasks()->where('title', 'Ship')->firstOrFail()->sprint_id)->exists())->toBeTrue();
    expect($project->notes()->where('text', 'Coordinate')->exists())->toBeTrue();
    expect($project->pins()->where('title', 'Runbook')->exists())->toBeTrue();
    expect($project->documents()->where('title', 'Runbook')->exists())->toBeTrue();
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

it('replaces default columns when applying template columns', function () {
    $user = User::factory()->create();
    $template = Backend::projectTemplate($user, [
        'name' => 'Single Column',
        'data' => deployTemplatePayload(),
    ]);

    $project = app(ProjectTemplateApplier::class)->apply($template, $user);

    expect($project->columns()->pluck('name')->all())->toBe(['Backlog']);
    expect($project->columns()->count())->toBe(1);
});

it('rejects malformed template payloads before cloning projects', function () {
    $user = User::factory()->create();
    $template = Backend::projectTemplate($user, [
        'name' => 'MalformedTemplate',
        'data' => ['columns' => 'not a list', 'tasks' => [], 'pins' => [], 'notes' => [], 'task_connections' => []],
    ]);
    $projectCount = Project::count();

    expect(fn () => app(ProjectTemplateApplier::class)->apply($template, $user))
        ->toThrow(InvalidArgumentException::class, 'Invalid template payload at columns: "not a list"; expected an array.');

    expect(Project::count())->toBe($projectCount);
    expect(Project::where('title', 'MalformedTemplate Copy')->exists())->toBeFalse();
});

it('reports nested template payload shape errors', function () {
    $validator = app(ProjectTemplatePayloadValidator::class);

    expect(fn () => $validator->validate(['tasks' => [['title' => ['bad' => 'shape']]]]))
        ->toThrow(InvalidArgumentException::class, 'Invalid template payload at tasks.0.title: {"bad":"shape"}; expected a scalar or null value.');
});

it('reports sprint template payload shape errors', function () {
    $validator = app(ProjectTemplatePayloadValidator::class);

    expect(fn () => $validator->validate(['sprints' => [['color' => ['bad' => 'shape']]]]))
        ->toThrow(InvalidArgumentException::class, 'Invalid template payload at sprints.0.color: {"bad":"shape"}; expected a scalar or null value.');
});

it('sends typed project invite notifications', function () {
    Notification::fake();
    [$owner, $project] = Backend::projectWithMember();
    $invitee = User::factory()->create();
    $invitation = ProjectInvitation::create([
        'project_id' => $project->id,
        'inviter_id' => $owner->id,
        'invitee_id' => $invitee->id,
        'status' => ProjectInvitationStatus::PENDING,
    ]);

    app(NotificationService::class)->sendProjectInvite($invitation);

    Notification::assertSentTo($invitee, ProjectActionNotification::class, function (ProjectActionNotification $notification) {
        return $notification->payload()['type'] === NotificationType::PROJECT_INVITE->value;
    });
});

it('serializes project action notifications for mail database and broadcasts', function () {
    $user = User::factory()->create();
    $project = Project::factory()->create(['title' => 'Meira']);
    $notification = new ProjectActionNotification(
        NotificationType::TASK_ASSIGNED,
        'Ada assigned Ship to you in Meira.',
        route('kanban', $project),
        'View task',
        $user,
        $project,
        ['id' => 'task-1', 'type' => 'task', 'title' => 'Ship'],
    );

    expect($notification->via($user))->toBe(['database', 'broadcast', 'mail']);
    expect($notification->databaseType($user))->toBe(NotificationType::TASK_ASSIGNED->value);
    expect($notification->payload())->toMatchArray([
        'type' => NotificationType::TASK_ASSIGNED->value,
        'project' => ['id' => $project->id, 'title' => 'Meira'],
    ]);
});

function deployTemplatePayload(): array
{
    return [
        'columns' => [['name' => 'Backlog', 'position' => 0, 'type' => ColumnType::BACKLOG->value]],
        'sprints' => [[
            'id' => 'template-sprint',
            'title' => 'Sprint One',
            'start_at' => '2026-05-01',
            'end_at' => '2026-05-15',
            'status' => 'planned',
            'goal' => 'Ship safely',
            'color' => '#16a34a',
        ]],
        'tasks' => [[
            'id' => 'template-task',
            'title' => 'Ship',
            'description' => 'Deploy safely',
            'image' => null,
            'position' => 0,
            'x' => 10,
            'y' => 20,
            'sprint_id' => 'template-sprint',
            'subtasks' => [['title' => 'Review', 'position' => 0, 'completed' => false]],
        ]],
        'task_connections' => [],
        'notes' => [['text' => 'Coordinate', 'x' => 1, 'y' => 2]],
        'pins' => [['title' => 'Runbook', 'url' => 'https://example.test', 'text' => null, 'position' => 0]],
        'documents' => [['title' => 'Runbook', 'markdown' => '# Runbook', 'version' => 2]],
    ];
}
