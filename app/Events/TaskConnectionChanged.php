<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskConnectionChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $sourceId;

    public string $targetId;

    public bool $connected;

    public int|string|null $userId;

    /**
     * Broadcast a task connection create/delete for open Traceboards.
     */
    public function __construct(string $sourceId, string $targetId, bool $connected, int|string|null $userId)
    {
        $this->sourceId = $sourceId;
        $this->targetId = $targetId;
        $this->connected = $connected;
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

    /**
     * @return array{sourceId: string, targetId: string, connected: bool, userId: int|string|null}
     */
    public function broadcastWith(): array
    {
        return [
            'sourceId' => $this->sourceId,
            'targetId' => $this->targetId,
            'connected' => $this->connected,
            'userId' => $this->userId,
        ];
    }
}
