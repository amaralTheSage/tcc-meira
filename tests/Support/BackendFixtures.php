<?php

namespace Tests\Support;

use App\Enums\ColumnType;
use App\Enums\Status;
use App\Models\Chat;
use App\Models\Column;
use App\Models\Message;
use App\Models\Note;
use App\Models\Pin;
use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\ProjectTemplate;
use App\Models\Sprint;
use App\Models\Subtask;
use App\Models\Tag;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Str;

class BackendFixtures
{
    /**
     * Create a project with one authenticated member.
     *
     * Example: [$user, $project] = BackendFixtures::projectWithMember();
     *
     * @return array{0: User, 1: Project}
     */
    public static function projectWithMember(?User $member = null, array $attributes = []): array
    {
        $member ??= User::factory()->create();
        $project = Project::factory()->create($attributes);
        $project->members()->attach($member);

        return [$member, $project];
    }

    /**
     * Attach a new member to the project.
     *
     * Example: $member = BackendFixtures::projectMember($project);
     */
    public static function projectMember(Project $project, array $attributes = []): User
    {
        $member = User::factory()->create($attributes);
        $project->members()->attach($member);

        return $member;
    }

    /**
     * Return one default project column by semantic type.
     *
     * Example: $done = BackendFixtures::defaultColumn($project, ColumnType::DONE);
     */
    public static function defaultColumn(Project $project, ColumnType $type): Column
    {
        return $project->columns()
            ->where('type', $type->value)
            ->firstOrFail();
    }

    /**
     * Create a project-owned task with valid defaults.
     *
     * Example: $task = BackendFixtures::task($project);
     */
    public static function task(Project $project, array $attributes = []): Task
    {
        $column = self::defaultColumn($project, ColumnType::BACKLOG);

        return Task::factory()->create(array_merge([
            'id' => (string) Str::uuid(),
            'project_id' => $project->id,
            'column_id' => $column->id,
            'status' => Status::PENDING->value,
        ], $attributes));
    }

    /**
     * Create a project-owned sprint.
     *
     * Example: $sprint = BackendFixtures::sprint($project);
     */
    public static function sprint(Project $project, array $attributes = []): Sprint
    {
        return Sprint::factory()->create(array_merge([
            'project_id' => $project->id,
        ], $attributes));
    }

    /**
     * Create a project-owned note.
     *
     * Example: $note = BackendFixtures::note($project);
     */
    public static function note(Project $project, array $attributes = []): Note
    {
        return Note::factory()->create(array_merge([
            'project_id' => $project->id,
        ], $attributes));
    }

    /**
     * Create a project-owned pin.
     *
     * Example: $pin = BackendFixtures::pin($project);
     */
    public static function pin(Project $project, array $attributes = []): Pin
    {
        return Pin::create(array_merge([
            'id' => (string) Str::uuid(),
            'project_id' => $project->id,
            'position' => 1,
        ], $attributes));
    }

    /**
     * Create a project-owned markdown document.
     *
     * Example: $document = BackendFixtures::document($project).
     */
    public static function document(Project $project, array $attributes = []): ProjectDocument
    {
        return ProjectDocument::factory()->create(array_merge([
            'project_id' => $project->id,
        ], $attributes));
    }

    /**
     * Create a project-owned tag.
     *
     * Example: $tag = BackendFixtures::tag($project);
     */
    public static function tag(Project $project, array $attributes = []): Tag
    {
        return Tag::factory()->create(array_merge([
            'project_id' => $project->id,
        ], $attributes));
    }

    /**
     * Create a task-owned subtask.
     *
     * Example: $subtask = BackendFixtures::subtask($task);
     */
    public static function subtask(Task $task, array $attributes = []): Subtask
    {
        return Subtask::factory()->create(array_merge([
            'task_id' => $task->id,
            'completed' => false,
        ], $attributes));
    }

    /**
     * Return the project chat created by the Project model boot hook.
     *
     * Example: $chat = BackendFixtures::chat($project);
     */
    public static function chat(Project $project): Chat
    {
        return $project->chat()->firstOrFail();
    }

    /**
     * Create a message in the project's chat.
     *
     * Example: $message = BackendFixtures::message($project, $user);
     */
    public static function message(Project $project, User $user, array $attributes = []): Message
    {
        return Message::create(array_merge([
            'chat_id' => self::chat($project)->id,
            'user_id' => $user->id,
            'content' => 'Message body',
            'image' => null,
        ], $attributes));
    }

    /**
     * Create a reusable project template.
     *
     * Example: $template = BackendFixtures::projectTemplate($user);
     */
    public static function projectTemplate(?User $user = null, array $attributes = []): ProjectTemplate
    {
        $user ??= User::factory()->create();

        return ProjectTemplate::factory()->create(array_merge([
            'user_id' => $user->id,
        ], $attributes));
    }

    /**
     * Build a publishable long-form description.
     *
     * Example: $description = BackendFixtures::publishDescription();
     */
    public static function publishDescription(): string
    {
        return str_repeat('Detailed project context for publication. ', 8);
    }
}
