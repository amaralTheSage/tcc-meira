import { Message, Project } from '@/types/models';
import { useEcho } from '@laravel/echo-react';
import { useEffect, useMemo, useState } from 'react';
import MessageContainer from './message-container';

export default function MessageArea({ project }: { project: Project }) {
    const projectMessages = useMemo(() => project.chat?.messages ?? [], [project.chat?.messages]);
    const [messages, setMessages] = useState<Message[]>(projectMessages);

    useEffect(() => {
        setMessages([...projectMessages].sort(sortMessagesByDate));
    }, [projectMessages]);

    useEcho<{ message: Message }>('private-chat', 'MessageAdded', (payload) => {
        const newMessage = payload.message;

        setMessages((prevMessages) => {
            return [...prevMessages, newMessage].sort(sortMessagesByDate);
        });
    });

    useEcho<{ message: Message }>('private-chat', 'MessageUpdated', (payload) => {
        setMessages((prevMessages) => updateMessage(prevMessages, payload.message));
    });

    useEcho<{ messageId: number | string }>('private-chat', 'MessageDeleted', (payload) => {
        setMessages((prevMessages) => prevMessages.filter((message) => String(message.id) !== String(payload.messageId)));
    });

    return (
        <div
            data-testid="team-chat-messages"
            className="custom-scrollbar flex min-h-0 w-full flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 md:px-8"
        >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-2">
                {messages.map((message, index) => (
                    <MessageContainer key={message.id} projectId={project.id} message={message} index={index} messages={messages} />
                ))}
            </div>
        </div>
    );
}

function updateMessage(messages: Message[], updatedMessage: Message): Message[] {
    return messages.map((message) => (message.id === updatedMessage.id ? updatedMessage : message)).sort(sortMessagesByDate);
}

function sortMessagesByDate(a: Message, b: Message): number {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
