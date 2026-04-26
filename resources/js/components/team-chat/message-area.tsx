import { Message, Project } from '@/types/models';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useState } from 'react';
import MessageContainer from './message-container';

export default function MessageArea({ project }: { project: Project }) {
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

    return (
        <div className="custom-scrollbar flex w-full flex-1 flex-col gap-2 overflow-y-scroll px-11">
            {messages.map((message, index) => (
                <MessageContainer key={message.id} message={message} index={index} messages={messages} />
            ))}
        </div>
    );
}
