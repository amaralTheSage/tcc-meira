<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'image', 'x', 'y', 'project_id'];

    public function project()
    {
        $this->belongsTo(Project::class);
    }
}
