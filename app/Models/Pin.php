<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pin extends Model
{
    protected $fillable = ['text', 'project_id', 'title', 'url','position'];

    public function project(): BelongsTo{
        return $this->belongsTo(Project::class);
    }
}
