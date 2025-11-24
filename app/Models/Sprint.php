<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sprint extends Model
{
    protected $fillable = [
        'title',
        'project_id',
        'start_at',
        'end_at',
    ];

    public function tasks(): HasMany {
        return $this->hasMany(Task::class);
    }
}
