<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskMoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $task_id;

    public int $position;

    public int|string|null $column_id;

    public function __construct(string $id, int $position, int|string|null $column)
    {
        $this->task_id = $id;
        $this->position = $position;
        $this->column_id = $column;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tasks'),
        ];
    }

    public function broadcastWith(): array
    {
        return ['columnId' => $this->column_id,
            'position' => $this->position,
            'taskId' => $this->task_id,
        ];
    }
}
