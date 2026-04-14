<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubtaskAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $subtask_id;

    public string $title;

    public function __construct(string $id, string $title)
    {
        $this->subtask_id = $id;
        $this->title = $title;
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
            'title' => $this->title,
        ];
    }
}
