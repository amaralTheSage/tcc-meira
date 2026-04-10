<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'title',
        'description',
    ];

    /**
     * Return the project this publication describes.
     *
     * Example: $post->project()->firstOrFail().
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Return gallery images for this community publication.
     *
     * Example: $post->images()->orderBy('id')->get().
     */
    public function images(): HasMany
    {
        return $this->hasMany(CommunityPostImage::class, 'post_id');
    }

    /**
     * Return project members shown on the community card.
     *
     * Example: $post->members()->pluck('name').
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'community_post_user', 'community_post_id', 'user_id');
    }
}
