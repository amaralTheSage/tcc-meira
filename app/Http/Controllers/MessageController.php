<?php

namespace App\Http\Controllers;

use App\Events\MessageAdded;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    
    public function index()
    {
       
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'integer', 'exists:chats,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $message = Message::create($validated);

        $message->load('user');
        broadcast(new MessageAdded($message));

        return redirect()->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
