<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CommunityPostImage extends Model
{
    protected $table = 'image_post';

    protected $fillable = [
        'image_id',
        'post_id',
    ];

    protected $appends = [
        'url',
    ];

    /**
     * Return the publication that owns this gallery image.
     *
     * Example: $image->post()->firstOrFail().
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(CommunityPost::class, 'post_id');
    }

    /**
     * Resolve stored image paths and external URLs into browser URLs.
     *
     * Example: $image->url.
     */
    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->image_id, 'http') || str_starts_with($this->image_id, '/')) {
            return $this->image_id;
        }

        return Storage::disk('public')->url($this->image_id);
    }
}
