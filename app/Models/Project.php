<?php

namespace App\Models;

use App\Enums\ColumnType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'edge_type',
        'animated_edges',
    ];

    /**
     * Return traceboard tasks owned by this project.
     *
     * Example: $project->tasks()->count().
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Return Kanban columns owned by this project.
     *
     * Example: $project->columns()->orderBy('position')->get().
     */
    public function columns(): HasMany
    {
        return $this->hasMany(Column::class);
    }

    /**
     * Return the reusable template published for this project.
     *
     * Example: $project->template()->exists().
     */
    public function template(): HasOne
    {
        return $this->hasOne(ProjectTemplate::class);
    }

    /**
     * Return traceboard notes owned by this project.
     *
     * Example: $project->notes()->create($payload).
     */
    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Return users who can access this project.
     *
     * Example: $project->members()->whereKey($user->id)->exists().
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    /**
     * Return pinboard items owned by this project.
     *
     * Example: $project->pins()->orderBy('position')->get().
     */
    public function pins(): HasMany
    {
        return $this->hasMany(Pin::class);
    }

    /**
     * Return tags owned by this project.
     *
     * Example: $project->tags()->pluck('name').
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Return sprints owned by this project.
     *
     * Example: $project->sprints()->where('status', 'active')->get().
     */
    public function sprints(): HasMany
    {
        return $this->hasMany(Sprint::class);
    }

    /**
     * Return the team chat owned by this project.
     *
     * Example: $project->chat()->firstOrFail().
     */
    public function chat(): HasOne
    {
        return $this->hasOne(Chat::class);
    }

    /**
     * Return markdown documents owned by this project.
     *
     * Example: $project->documents()->oldest()->first().
     */
    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class);
    }

    /**
     * Pending or completed invitations for this project.
     *
     * Example: $project->invitations()->whereStatus('pending')->get().
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    /**
     * Create project-owned defaults immediately after project creation.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::created(function (Project $project): void {
            $defaultColumns = [
                ['name' => 'Backlog', 'position' => 0, 'type' => ColumnType::BACKLOG],
                ['name' => 'To Do', 'position' => 1, 'type' => ColumnType::TODO],
                ['name' => 'In Progress', 'position' => 2, 'type' => ColumnType::IN_PROGRESS],
                ['name' => 'Done', 'position' => 3, 'type' => ColumnType::DONE],
            ];

            foreach ($defaultColumns as $columnData) {
                $project->columns()->create([
                    'name' => $columnData['name'],
                    'position' => $columnData['position'],
                    'type' => $columnData['type']->value,
                ]);
            }

            $project->chat()->create([
                'project_id' => $project->id,
            ]);

            ProjectDocument::createDefaultForProject($project);
        });
    }
}
