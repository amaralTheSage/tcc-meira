<?php

namespace App\Http\Controllers;

use App\Events\MessageAdded;
use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Store a team chat message and broadcast it.
     *
     * Example: POST /{project}/team-chat/message.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'integer', 'exists:chats,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'content' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'],
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('messages', 'public');
        }

        $message = Message::create([
            'chat_id' => $validated['chat_id'],
            'user_id' => $validated['user_id'],
            'content' => $validated['content'] ?? '',
            'image' => $imagePath ?? '',
        ]);

        $message->load('user');
        broadcast(new MessageAdded($message));

        return redirect()->back();
    }
}
