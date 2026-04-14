<?php

namespace App\Events;

use App\Events\Concerns\FormatsAssignmentUser;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskAssignedUser implements ShouldBroadcastNow
{
    use Dispatchable, FormatsAssignmentUser, InteractsWithSockets, SerializesModels;

    public string $project_id;

    public string $task_id;

    /** @var array{id: int, name: string, email: string, avatar: ?string, email_verified_at: ?string} */
    public array $user;

    public bool $assigned;

    public function __construct(string $project_id, string $task_id, User $user, bool $assigned)
    {
        $this->project_id = $project_id;
        $this->task_id = $task_id;
        $this->user = self::assignmentUserPayload($user);
        $this->assigned = $assigned;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tasks_users'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'projectId' => $this->project_id,
            'taskId' => $this->task_id,
            'user' => $this->user,
            'assigned' => $this->assigned,
        ];
    }
}
