<?php

namespace App\Events;

use App\Models\ProjectDocument;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectDocumentSaved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ProjectDocument $document,
        public User $editor,
    ) {}

    /**
     * Broadcast saved markdown to members viewing the same document.
     *
     * Example: broadcast(new ProjectDocumentSaved($document, $user)).
     */
    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel($this->channelName());
    }

    /**
     * Return the minimal payload needed to sync open editors.
     *
     * Example: $event->broadcastWith()['document']['markdown'].
     *
     * @return array<string, array<string, int|string|null>>
     */
    public function broadcastWith(): array
    {
        return [
            'document' => [
                'id' => $this->document->id,
                'title' => $this->document->title,
                'markdown' => $this->document->markdown,
                'version' => $this->document->version,
                'updated_at' => $this->document->updated_at?->toISOString(),
            ],
            'editor' => [
                'id' => $this->editor->id,
                'name' => $this->editor->name,
                'avatar' => $this->editor->avatar,
            ],
        ];
    }

    private function channelName(): string
    {
        return "project.{$this->document->project_id}.docs.{$this->document->id}";
    }
}
