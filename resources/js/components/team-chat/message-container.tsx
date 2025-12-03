import { Auth, SharedData } from "@/types";
import { Message } from "@/types/models";
import { usePage } from "@inertiajs/react";

export default function MessageContainer({ message }:{ message: Message }){

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
    
    return(
        <div className={`flex items-center justify-end gap-2 ${message.user.id != auth.user.id ? 'flex-row-reverse' : ''}`}>
            <div className={`flex flex-col gap-2 bg-black rounded-md ${message.user.id != auth.user.id ? 'rounded-tl-none' : 'rounded-tr-none'} p-3 min-w-44 mt-10`}>
                <div className="flex gap-2 text-sm">
                    <p>{message.user.name}</p>
                    <p className="text-neutral-400">{formatDate(message.created_at)}</p>
                </div>
                <p className="text-neutral-400">{message.content}</p>
            </div>
            <img className="rounded-full w-10" src={message.user.avatar} alt="" />
        </div>
    )
}