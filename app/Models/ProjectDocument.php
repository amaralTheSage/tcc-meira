<?php

namespace App\Models;

use Database\Factories\ProjectDocumentFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectDocument extends Model
{
    /** @use HasFactory<ProjectDocumentFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'last_edited_by',
        'title',
        'markdown',
        'version',
    ];

    protected $casts = [
        'version' => 'integer',
    ];

    /**
     * Create the first editable markdown document for a project.
     *
     * Example: ProjectDocument::createDefaultForProject($project, $user, 'Runbook').
     */
    public static function createDefaultForProject(Project $project, ?User $editor = null, string $title = 'Project Docs'): self
    {
        return $project->documents()->create([
            'title' => $title,
            'markdown' => self::defaultMarkdown($title),
            'version' => 1,
            'last_edited_by' => $editor?->id,
        ]);
    }

    /**
     * Store a recoverable markdown snapshot for a saved version.
     *
     * Example: $document->recordRevision($user).
     */
    public function recordRevision(?User $editor = null): ProjectDocumentRevision
    {
        return $this->revisions()->create([
            'user_id' => $editor?->id,
            'version' => $this->version,
            'markdown' => $this->markdown,
        ]);
    }

    /**
     * Return the project that owns this document.
     *
     * Example: $document->project()->firstOrFail().
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Return the project member who last saved this document.
     *
     * Example: $document->lastEditor()->first().
     */
    public function lastEditor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_edited_by');
    }

    /**
     * Return historical markdown snapshots for this document.
     *
     * Example: $document->revisions()->latest()->first().
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(ProjectDocumentRevision::class);
    }

    /**
     * Return uploaded assets referenced by this document.
     *
     * Example: $document->assets()->pluck('path').
     */
    public function assets(): HasMany
    {
        return $this->hasMany(ProjectDocumentAsset::class);
    }

    private static function defaultMarkdown(string $title): string
    {
        return "# {$title}\n\nStart writing project documentation here.";
    }
}
