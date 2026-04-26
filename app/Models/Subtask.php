<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subtask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['title', 'position', 'task_id', 'completed'];

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'subtask_user');
    }
}
