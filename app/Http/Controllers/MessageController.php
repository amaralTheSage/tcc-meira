<?php

namespace App\Http\Controllers;

use App\Events\MessageAdded;
use App\Events\MessageDeleted;
use App\Events\MessageUpdated;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Chat;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class MessageController extends Controller
{
    use GuardsProjectResources;

    /**
     * Store a team chat message and broadcast it.
     *
     * Example: POST /{project}/team-chat/message.
     */
    public function store(Project $project, Request $request, NotificationService $notifications): RedirectResponse
    {
        $validated = $request->validate([
            'chat_id' => ['required', 'integer', 'exists:chats,id'],
            'user_id' => ['sometimes', 'integer', 'exists:users,id'],
            'content' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'mentioned_user_ids' => ['sometimes', 'array'],
            'mentioned_user_ids.*' => ['integer', 'distinct', $this->projectMemberRule($project)],
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
        $this->notifyMentionedUsers($project, $request, $message, $validated['mentioned_user_ids'] ?? [], $notifications);

        return redirect()->back();
    }

    /**
     * Edit one chat message authored by the current user.
     *
     * Example: PATCH /{project}/team-chat/messages/{message}.
     */
    public function update(Project $project, Message $message, Request $request): RedirectResponse
    {
        $this->ensureEditableMessage($project, $message, $request);
        $validated = $request->validate(['content' => ['required', 'string', 'max:1000']]);

        $message->update(['content' => $validated['content'], 'edited_at' => now()]);
        $message->load('user');
        broadcast(new MessageUpdated($message));

        return back();
    }

    /**
     * Soft delete one chat message authored by the current user.
     *
     * Example: DELETE /{project}/team-chat/messages/{message}.
     */
    public function destroy(Project $project, Message $message, Request $request): RedirectResponse
    {
        $this->ensureEditableMessage($project, $message, $request);
        $messageId = $message->id;
        $message->delete();
        broadcast(new MessageDeleted($messageId));

        return back();
    }

    /**
     * @param  array<int, int>  $mentionedUserIds
     */
    private function notifyMentionedUsers(
        Project $project,
        Request $request,
        Message $message,
        array $mentionedUserIds,
        NotificationService $notifications
    ): void {
        $project->members()
            ->whereKey($mentionedUserIds)
            ->get()
            ->each(fn (User $member) => $notifications->sendChatMention($member, $request->user(), $project, $message));
    }

    private function ensureEditableMessage(Project $project, Message $message, Request $request): void
    {
        $this->ensureModelBelongsToProject($project, $message->chat);
        abort_unless($message->user_id === $request->user()->id, 403, "Message {$message->id} must belong to user {$request->user()->id}.");
    }

    private function projectMemberRule(Project $project): Exists
    {
        return Rule::exists('project_user', 'user_id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }
}
