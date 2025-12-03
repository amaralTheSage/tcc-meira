import { Message, Project } from "@/types/models";
import MessageContainer from "./message-container";
import { useEcho } from "@laravel/echo-react";
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function MessageArea({ project }:{ project:Project }){

    const [messages, setMessages] = useState<Message[]>(project.chat.messages);

    useEffect(() => {
        setMessages(project.chat.messages);
    }, [project.chat.messages]);

    useEcho<{ message: Message }>('private-chat', 'MessageAdded', (payload) => {
        const newMessage = payload.message; 
        
        setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    
    return(
        <div className="w-full max-h-5/6 flex-1 bg-accent pb-5 px-8 flex flex-col gap-2 overflow-y-scroll custom-scrollbar">
            {messages.map((message) => (
                <MessageContainer key={message.id} message={message} />
            ))
            }
        </div>
    )
}
