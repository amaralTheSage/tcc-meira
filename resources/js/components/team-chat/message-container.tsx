import { Message } from '@/types/models';

export default function MessageContainer({ message, index, messages }: { message: Message; index: number; messages: Message[] }) {
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
                    <p className="max-w-6xl text-neutral-400">{message.content}</p>
                </div>
                {!isPreviousMessageFromSameUser && <img className="mt-4 h-10 w-10 rounded-full" src={message.user.avatar ?? undefined} alt="" />}
            </div>
        </>
    );
}
