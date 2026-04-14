<?php

namespace App\Models;

use App\Enums\ProjectInvitationStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectInvitation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'inviter_id',
        'invitee_id',
        'status',
        'accepted_at',
        'declined_at',
    ];

    /**
     * The project that will receive a new member after acceptance.
     *
     * Example: $invitation->project->title.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * The user who sent the invitation.
     *
     * Example: $invitation->inviter->name.
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inviter_id');
    }

    /**
     * The user who can accept or decline the invitation.
     *
     * Example: $invitation->invitee->email.
     */
    public function invitee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invitee_id');
    }

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'declined_at' => 'datetime',
            'status' => ProjectInvitationStatus::class,
        ];
    }
}
