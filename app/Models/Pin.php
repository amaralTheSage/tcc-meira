<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pin extends Model
{
    use HasUuids;

    protected $fillable = ['id', 'text', 'project_id', 'title', 'url', 'position', 'x', 'y'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
