<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['id', 'text', 'x', 'y', 'project_id'];

    public $incrementing = false;

    protected $keyType = 'string';

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
