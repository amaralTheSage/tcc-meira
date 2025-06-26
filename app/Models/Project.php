<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function members(): BelongsToMany {
        return $this->belongsToMany(User::class);
    }
}
