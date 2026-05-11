<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Notifications\Notification;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'workos_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'workos_id',
        'remember_token',
    ];

    public function templates(): HasMany
    {
        return $this->hasMany(ProjectTemplate::class);
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(CommunityPost::class);
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class)->using(ProjectMembership::class)->withTimestamps();
    }

    /**
     * Project invitations sent by this user.
     *
     * Example: $user->sentProjectInvitations()->where('status', 'pending')->count().
     */
    public function sentProjectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'inviter_id');
    }

    /**
     * Project invitations addressed to this user.
     *
     * Example: $user->receivedProjectInvitations()->latest()->get().
     */
    public function receivedProjectInvitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'invitee_id');
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user', 'user_id', 'task_id')->withTimestamps();
    }

    /**
     * Return the private Reverb channel for user notification broadcasts.
     *
     * Example: useEchoNotification(`App.Models.User.${user.id}`, callback).
     */
    public function receivesBroadcastNotificationsOn(Notification $notification): string
    {
        return 'App.Models.User.'.$this->id;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'has_collaborated' => 'boolean',
            'password' => 'hashed',
            'shared_projects_count' => 'integer',
        ];
    }
}
