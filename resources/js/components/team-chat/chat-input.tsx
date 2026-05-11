import type { SharedData, User } from '@/types';
import type { Project } from '@/types/models';
import type { VisitOptions } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react';
import { Plus, Send, Smile } from 'lucide-react';
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
        <div className="relative border-t border-border/70 bg-background px-4 py-3 md:px-8">
            <form
                data-testid="team-chat-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                }}
                className="mx-auto flex h-12 w-full max-w-5xl items-center gap-2 rounded-md border border-border/70 bg-sidebar/50 px-2 shadow-sm shadow-black/20"
            >
                <div className="relative flex h-full items-center border-r border-border/70 pr-1">
                    <button
                        data-testid="team-chat-attachment-trigger"
                        type="button"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setMenuOpen(!menu)}
                    >
                        <Plus className="size-4" />
                    </button>

                    {menu && <ModalPlus onImageSelect={handleImageSelect} />}
                </div>

                <input
                    data-testid="team-chat-input"
                    className="min-w-0 grow resize-none bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    type="text"
                    placeholder="Type a message..."
                />
                {mentionOptions.length > 0 && (
                    <div className="absolute bottom-full left-14 mb-2 w-64 overflow-hidden rounded-md border border-border/70 bg-popover shadow-md">
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
                        className={`flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted ${
                            isHoveringEmoji ? 'text-red-300' : 'text-muted-foreground'
                        }`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        onMouseEnter={() => setIsHoveringEmoji(true)}
                        onMouseLeave={() => setIsHoveringEmoji(false)}
                    >
                        <Smile className="size-4" />
                    </button>
                    <button
                        data-testid="team-chat-send"
                        type="submit"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-md bg-red-800 text-white transition-colors hover:bg-red-700"
                    >
                        <Send className="size-4" />
                    </button>
                </div>
            </form>

            {showEmojiPicker && (
                <div className="absolute right-4 bottom-full mb-2 md:right-8">
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
