<?php

namespace App\Http\Controllers;

use App\Events\MessageAdded;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    use GuardsProjectResources;

    /**
     * Store a team chat message and broadcast it.
     *
     * Example: POST /{project}/team-chat/message.
     */
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'integer', 'exists:chats,id'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'content' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        $this->ensureModelBelongsToProject($project, Chat::findOrFail($validated['chat_id']));

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('messages', 'public');
        }

        $message = Message::create([
            'chat_id' => $validated['chat_id'],
            'user_id' => $request->user()->id,
            'content' => $validated['content'] ?? '',
            'image' => $imagePath ?? '',
        ]);

        $message->load('user');
        broadcast(new MessageAdded($message));

        return redirect()->back();
    }
}
