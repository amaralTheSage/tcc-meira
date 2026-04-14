<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;

    public function __construct(int $messageId)
    {
        $this->messageId = $messageId;
    }

    /**
     * Get the channel used by the team chat stream.
     *
     * Example: useEcho('private-chat', 'MessageDeleted', callback).
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('private-chat'),
        ];
    }

    /**
     * Broadcast the deleted message id.
     *
     * Example: payload.messageId.
     *
     * @return array<string, int>
     */
    public function broadcastWith(): array
    {
        return ['messageId' => $this->messageId];
    }
}
