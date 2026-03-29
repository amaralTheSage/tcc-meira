<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'id',
        'title',
        'image',
        'x',
        'y',
        'column_id',
        'project_id',
        'sprint_id',
        'position',
        'description',
        'status',
    ];

    public $incrementing = false;

    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class);
    }

    public function column(): BelongsTo
    {
        return $this->belongsTo(Column::class);
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function sources()
    {
        return $this->belongsToMany(Task::class, 'task_connections', 'target_id', 'source_id');
    }

    public function targets()
    {
        return $this->belongsToMany(Task::class, 'task_connections', 'source_id', 'target_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'task_user', 'task_id', 'user_id')->withTimestamps();
    }
}
