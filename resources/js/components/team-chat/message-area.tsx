import { Message, Project } from "@/types/models";
import MessageContainer from "./message-container";
import { useEcho } from "@laravel/echo-react";
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function MessageArea({ project }:{ project:Project }){

    const [messages, setMessages] = useState<Message[]>(project.chat.messages);

    useEffect(() => {
        setMessages(project.chat.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    }, [project.chat.messages]);

    useEcho<{ message: Message }>('private-chat', 'MessageAdded', (payload) => {
        const newMessage = payload.message;

        setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, newMessage];
            return updatedMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
    });

    const getDateOnly = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

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
        <div className="w-full flex-1 pb-5 px-11 flex flex-col gap-2 overflow-y-scroll custom-scrollbar">
            
            {messages.map((message, index) => (
                <>
                    {index - 1 < 0 &&

                        <div className="flex items-center justify-center my-4">
                            <hr className="w-3/6 border-red-900"/>
                            <span className="bg-red-900 text-neutral-300 px-3 py-1 rounded-full text-sm">
                                {formatDateForDisplay(message.created_at)}
                            </span>
                            <hr className="w-3/6 border-red-900"/>
                        </div>

                    }
                    <MessageContainer key={message.id} message={message} index={index} messages={messages} />
                </>
            ))
            }
        </div>
    )
}
