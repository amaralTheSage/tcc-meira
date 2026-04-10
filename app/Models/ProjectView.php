<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectView extends Model
{
    protected $fillable = [
        'project_id',
        'visitor_hash',
        'viewed_on',
    ];

    /**
     * Return the shared project this view belongs to.
     *
     * Example: $view->project()->firstOrFail().
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Cast the viewed date for unique daily counting.
     *
     * Example: $view->viewed_on->isToday().
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'viewed_on' => 'date',
        ];
    }
}
