<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Subtask extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['title', 'position', 'task_id', 'completed'];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'subtask_user');
    }
}
