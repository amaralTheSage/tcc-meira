import ChatInput from '@/components/team-chat/chat-input';
import MessageArea from '@/components/team-chat/message-area';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Team Chat',
        href: '/team-chat',
    },
];

export default function TeamChat({ project }: { project: Project }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Team Chat'," />
            <div className="flex h-full flex-col overflow-hidden">
                <MessageArea project={project} />
                <ChatInput project={project} />
            </div>
        </AppLayout>
    );
}
