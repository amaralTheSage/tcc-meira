<?php

namespace App\Models;

use App\Services\CollaborationHistoryService;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ProjectMembership extends Pivot
{
    public $incrementing = true;

    protected $table = 'project_user';

    /**
     * Record collaborator history whenever a project membership is created.
     */
    protected static function booted(): void
    {
        static::created(function (ProjectMembership $membership): void {
            app(CollaborationHistoryService::class)->recordProjectMembership(
                (string) $membership->project_id,
                (int) $membership->user_id,
            );
        });
    }
}
