<?php

namespace App\Models;

use Database\Factories\ProjectDocumentRevisionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectDocumentRevision extends Model
{
    /** @use HasFactory<ProjectDocumentRevisionFactory> */
    use HasFactory;

    protected $fillable = [
        'project_document_id',
        'user_id',
        'version',
        'markdown',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    /**
     * Return the document this revision snapshots.
     *
     * Example: $revision->document()->firstOrFail().
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ProjectDocument::class, 'project_document_id');
    }

    /**
     * Return the user who saved this revision.
     *
     * Example: $revision->user()->first().
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
