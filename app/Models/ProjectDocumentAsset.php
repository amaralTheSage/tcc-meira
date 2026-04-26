<?php

namespace App\Models;

use Database\Factories\ProjectDocumentAssetFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDocumentAsset extends Model
{
    /** @use HasFactory<ProjectDocumentAssetFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_document_id',
        'uploaded_by',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    /**
     * Return the document that owns this uploaded asset.
     *
     * Example: $asset->document()->firstOrFail().
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ProjectDocument::class, 'project_document_id');
    }

    /**
     * Return the project member who uploaded this asset.
     *
     * Example: $asset->uploader()->first().
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
