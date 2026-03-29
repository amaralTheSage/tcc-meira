<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = ['id', 'text', 'x', 'y', 'project_id'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
