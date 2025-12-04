<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

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
