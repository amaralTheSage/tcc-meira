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

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function columns(): HasMany
    {
        return $this->hasMany(Column::class);
    }

    public function template(): HasOne
    {
        return $this->hasOne(ProjectTemplate::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function pins(): HasMany
    {
        return $this->hasMany(Pin::class);
    }

    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    public function chat(): HasOne
    {
        return $this->hasOne(Chat::class);
    }

    /**
     * The "booted" method of the model.
     *
     *
      @returns void
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function ($project) {
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
                'project_id' => $project->id
            ]);
        });
    }
}
