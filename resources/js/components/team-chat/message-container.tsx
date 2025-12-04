import { Auth, SharedData } from "@/types";
import { Message } from "@/types/models";
import { usePage } from "@inertiajs/react";

export default function MessageContainer({ message, index, messages }:{ message: Message, index: number, messages: Message[]}){

    const { auth } = usePage<SharedData>().props;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const isPreviousMessageFromSameUser = index > 0 && messages[index - 1].user.id === message.user.id;

    const getDateOnly = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const isPreviousMessageFromSameDate = index > 0 && getDateOnly(messages[index - 1].created_at) !== getDateOnly(message.created_at);

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
                day: 'numeric'
            });
        }
    };

    return(
        <>
        {isPreviousMessageFromSameDate && (
            <div className="flex items-center justify-center my-4">
                <hr className="w-3/6 border-red-900"/>
                <span className="bg-red-900 text-neutral-300 min-w-56 px-3 py-1 rounded-full text-sm">
                    {formatDateForDisplay(message.created_at)}
                </span>
                <hr className="w-3/6 border-red-900"/>
            </div>
        )}
        <div className="flex justify-end gap-2 flex-row-reverse">
            <div className={`flex flex-col gap-2 p-3 min-w-44 ${isPreviousMessageFromSameUser ? '-mt-4 ml-12' : ''}`}>
                {!isPreviousMessageFromSameUser && (
                    <div className="flex gap-2 text-sm">
                        <p>{message.user.name}</p>
                        <p className="text-neutral-400">{formatDate(message.created_at)}</p>
                    </div>
                )}
                <p className="max-w-6xl text-neutral-400">{message.content}</p>
            </div>
            {!isPreviousMessageFromSameUser && (
                <img className="rounded-full w-10 h-10 mt-4" src={message.user.avatar} alt="" />
            )}

        </div>
        </>
    )
}