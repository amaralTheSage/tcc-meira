<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CursorMoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $x;

    public int $y;

    public int|string $id;

    public function __construct(int $x, int $y, int|string $id)
    {
        $this->x = $x;
        $this->y = $y;
        $this->id = $id;
    }

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('cursor');
    }
}
