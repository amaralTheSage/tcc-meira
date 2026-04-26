<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NodeDragged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $node_id;

    public $type;

    public $x;

    public $y;

    public $userId;

    /**
     * Create a new event instance.
     */
    public function __construct($id, $type, $x, $y, $userId)
    {
        $this->node_id = $id;
        $this->type = $type;
        $this->x = $x;
        $this->y = $y;
        $this->userId = $userId;
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
        return ['nodeId' => $this->node_id,
            'type' => $this->type,
            'x' => $this->x,
            'y' => $this->y,
            'userId' => $this->userId,
        ];
    }
}
