import type { SharedData } from '@/types';
import { Message } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';

export default function MessageContainer({
    projectId,
    message,
    index,
    messages,
}: {
    projectId: string;
    message: Message;
    index: number;
    messages: Message[];
}) {
    const { auth } = usePage<SharedData>().props;
    const [isEditing, setIsEditing] = useState(false);
    const [draftContent, setDraftContent] = useState(message.content);
    const canEdit = message.user.id === auth.user.id;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const isPreviousMessageFromSameUser = index > 0 && messages[index - 1].user.id === message.user.id;

    const getDateOnly = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const isPreviousMessageFromSameDate = index > 0 && getDateOnly(messages[index - 1].created_at) !== getDateOnly(message.created_at);
    // A condição para mostrar o separador de data
    const shouldShowDateSeparator = index === 0 || isPreviousMessageFromSameDate;

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (getDateOnly(dateString) === getDateOnly(today.toISOString())) {
            return 'Today';
        } else if (getDateOnly(dateString) === getDateOnly(yesterday.toISOString())) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        }
    };

    function saveEdit(): void {
        router.patch(route('message.update', { project: projectId, message: message.id }), { content: draftContent }, { preserveScroll: true });
        setIsEditing(false);
    }

    function deleteMessage(): void {
        router.delete(route('message.destroy', { project: projectId, message: message.id }), { preserveScroll: true });
    }

    return (
        <>
            {shouldShowDateSeparator && (
                <div className="my-4 flex items-center justify-center">
                    <hr className="w-3/6 border-red-900" />
                    <span className="min-w-56 rounded-full bg-red-900 px-3 py-1 text-sm text-neutral-300">
                        {formatDateForDisplay(message.created_at)}
                    </span>
                    <hr className="w-3/6 border-red-900" />
                </div>
            )}

            <div data-testid={`team-chat-message-${message.id}`} className="flex flex-row-reverse justify-end gap-2">
                <div className={`flex min-w-44 flex-col gap-2 p-3 ${isPreviousMessageFromSameUser ? '-mt-4 ml-12' : ''}`}>
                    {!isPreviousMessageFromSameUser && (
                        <div className="flex gap-2 text-sm">
                            <p>{message.user.name}</p>
                            <p className="text-neutral-400">{formatDate(message.created_at)}</p>
                        </div>
                    )}
                    {message.image && <img src={`/storage/${message.image}`} alt="Message image" className="max-h-96 max-w-96 rounded-lg" />}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                className="min-w-72 rounded border border-neutral-600 bg-background px-2 py-1 text-sm"
                                value={draftContent}
                                onChange={(event) => setDraftContent(event.target.value)}
                            />
                            <button type="button" aria-label="Save message edit" onClick={saveEdit}>
                                <Check className="h-4 w-4" />
                            </button>
                            <button type="button" aria-label="Cancel message edit" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="group flex items-center gap-2">
                            <p className="max-w-6xl text-neutral-400">{message.content}</p>
                            {message.edited_at && <span className="text-xs text-muted-foreground">(edited)</span>}
                            {canEdit && (
                                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                    <button type="button" aria-label="Edit message" onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button type="button" aria-label="Delete message" onClick={deleteMessage}>
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isPreviousMessageFromSameUser && <img className="mt-4 h-10 w-10 rounded-full" src={message.user.avatar ?? undefined} alt="" />}
            </div>
        </>
    );
}
