import type { SharedData } from '@/types';
import type { Project } from '@/types/models';
import type { User } from '@/types';
import type { VisitOptions } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { useState } from 'react';
import { toast } from 'sonner';
import ModalPlus from './modal-plus';

type ChatMessagePayload = {
    chat_id: string;
    user_id: string;
    content: string;
    mentioned_user_ids: number[];
};

export default function ChatInput({ project }: { project: Project }) {
    const [message, setMessage] = useState('');

    const [menu, setMenuOpen] = useState(false);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isHoveringEmoji, setIsHoveringEmoji] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [mentionedUserIds, setMentionedUserIds] = useState<number[]>([]);

    const handleReset = () => {
        setMessage('');
        setSelectedImage(null);
        setMentionedUserIds([]);
    };

    const handleImageSelect = (file: File) => {
        setSelectedImage(file);
        setMenuOpen(false);
    };

    const onEmojiClick = (emojiObject: EmojiClickData) => {
        setMessage((prevMessage) => prevMessage + emojiObject.emoji);
        setShowEmojiPicker(false);
    };

    const { auth } = usePage<SharedData>().props;

    const chat = project.chat?.id;
    const mentionQuery = activeMentionQuery(message);
    const mentionOptions = mentionQuery === null ? [] : filteredMentionOptions(project.members, auth.user.id, mentionQuery);

    function sendMessage(): void {
        if (!chat) {
            toast.error('Project chat is not available.');
            return;
        }

        if (selectedImage) {
            sendImageMessage(chat.toString(), selectedImage);
            return;
        }

        router.post(route('message.store', project.id.toString()), chatPayload(chat.toString()), chatRequestOptions());
    }

    function sendImageMessage(chatId: string, image: File): void {
        const formData = new FormData();
        const payload = chatPayload(chatId);

        formData.append('chat_id', payload.chat_id);
        formData.append('user_id', payload.user_id);
        formData.append('content', payload.content);
        formData.append('image', image);
        payload.mentioned_user_ids.forEach((userId) => formData.append('mentioned_user_ids[]', userId.toString()));

        router.post(route('message.store', project.id.toString()), formData, { ...chatRequestOptions(), forceFormData: true });
    }

    function chatPayload(chatId: string): ChatMessagePayload {
        return {
            chat_id: chatId,
            user_id: auth.user.id.toString(),
            content: message,
            mentioned_user_ids: activeMentionedUserIds(mentionedUserIds, project.members, message),
        };
    }

    function selectMention(user: User): void {
        setMessage((currentMessage) => replaceActiveMention(currentMessage, user.name));
        setMentionedUserIds((currentIds) => (currentIds.includes(user.id) ? currentIds : [...currentIds, user.id]));
    }

    function chatRequestOptions(): VisitOptions {
        return {
            preserveScroll: false,
            onSuccess: () => {
                handleReset();
                toast.success('Message sent successfully');
            },
            onError: () => {
                setMessage(message);
                toast.error('An error occurred when sending the message.');
            },
        };
    }

    return (
        <div className="relative flex w-full border-2 border-solid border-t-neutral-700 bg-accent p-3">
            <form
                data-testid="team-chat-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
                className="m-auto flex h-full w-full items-center gap-2.5 rounded-2xl border-2 border-solid border-neutral-500"
            >
                <div className="h-full border-r-2 border-solid border-neutral-500">
                    <button
                        data-testid="team-chat-attachment-trigger"
                        type="button"
                        className="fa-solid fa-plus cursor-pointer p-4 hover:text-red-600"
                        onClick={() => setMenuOpen(!menu)}
                    ></button>

                    {menu && <ModalPlus onImageSelect={handleImageSelect} />}
                </div>

                <input
                    data-testid="team-chat-input"
                    className="grow resize-none focus:outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder="Type a message..."
                />
                {mentionOptions.length > 0 && (
                    <div className="absolute bottom-full left-14 mb-2 w-64 overflow-hidden rounded-md border bg-popover shadow-md">
                        {mentionOptions.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => selectMention(user)}
                            >
                                @{user.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        className={`cursor-pointer text-xl ${isHoveringEmoji ? 'fa-solid fa-face-laugh text-red-600' : 'fa-solid fa-face-meh'}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        onMouseEnter={() => setIsHoveringEmoji(true)}
                        onMouseLeave={() => setIsHoveringEmoji(false)}
                    ></button>
                    <button
                        data-testid="team-chat-send"
                        type="submit"
                        className="fa-solid fa-paper-plane cursor-pointer border-none bg-transparent p-4 hover:text-red-600"
                    ></button>
                </div>
            </form>

            {showEmojiPicker && (
                <div className="absolute right-0 bottom-full mb-2">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
            )}
        </div>
    );
}

function activeMentionQuery(message: string): string | null {
    const match = message.match(/(^|\s)@([^\s@]*)$/);

    return match?.[2]?.toLowerCase() ?? null;
}

function filteredMentionOptions(members: User[], currentUserId: number, query: string): User[] {
    return members
        .filter((member) => member.id !== currentUserId)
        .filter((member) => member.name.toLowerCase().includes(query))
        .slice(0, 5);
}

function replaceActiveMention(message: string, name: string): string {
    return message.replace(/(^|\s)@([^\s@]*)$/, `$1@${name} `);
}

function activeMentionedUserIds(mentionedUserIds: number[], members: User[], message: string): number[] {
    return mentionedUserIds.filter((userId) => {
        const member = members.find((currentMember) => currentMember.id === userId);

        return member ? message.includes(`@${member.name}`) : false;
    });
}
