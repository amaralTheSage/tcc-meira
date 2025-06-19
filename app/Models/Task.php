<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = ['id', 'title', 'image', 'x', 'y', 'project_id'];

    public $incrementing = false;

    protected $keyType = 'string';

    public function project()
    {
        $this->belongsTo(Project::class);
    }
}
