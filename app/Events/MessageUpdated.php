<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Message $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    /**
     * Get the channel used by the team chat stream.
     *
     * Example: useEcho('private-chat', 'MessageUpdated', callback).
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
     * Broadcast the edited message with its author.
     *
     * Example: payload.message.content.
     *
     * @return array<string, Message>
     */
    public function broadcastWith(): array
    {
        $this->message->load('user');

        return ['message' => $this->message];
    }
}
