<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommunityPost extends Model
{
        protected $fillable = [
        'title',
        'description'
    ];

        public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
