<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubtaskComplete implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $subtask_id;

    public bool $completed;

    public function __construct(string $subtask_id, bool $completed)
    {
        $this->subtask_id = $subtask_id;
        $this->completed = $completed;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('subtasks'),
        ];
    }

    public function broadcastWith(): array
    {
        return ['subtaskId' => $this->subtask_id,
            'completed' => $this->completed,
        ];
    }
}
