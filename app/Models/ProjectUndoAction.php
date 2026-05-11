<?php

namespace App\Models;

use App\Enums\ProjectUndoActionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectUndoAction extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'user_id',
        'action_type',
        'action_label',
        'undo_payload',
        'undone_at',
    ];

    protected function casts(): array
    {
        return [
            'action_type' => ProjectUndoActionType::class,
            'undo_payload' => 'array',
            'undone_at' => 'datetime',
        ];
    }

    /**
     * Return the project timeline this undo action belongs to.
     *
     * Example: $undoAction->project()->firstOrFail().
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Return the member who can execute this undo action.
     *
     * Example: $undoAction->user()->firstOrFail().
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
