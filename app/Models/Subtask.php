<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = ['title', 'position', 'task_id'];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
