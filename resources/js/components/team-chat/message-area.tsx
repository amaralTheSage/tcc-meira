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

    return (
        <div data-testid="team-chat-messages" className="custom-scrollbar flex w-full flex-1 flex-col gap-2 overflow-y-scroll px-11">
            {messages.map((message, index) => (
                <MessageContainer key={message.id} message={message} index={index} messages={messages} />
            ))}
        </div>
    );
}

function sortMessagesByDate(a: Message, b: Message): number {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}
