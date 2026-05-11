import ChatInput from '@/components/team-chat/chat-input';
import MessageArea from '@/components/team-chat/message-area';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { MessageSquareText } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Team Chat',
        href: '/team-chat',
    },
];

export default function TeamChat({ project }: { project: Project }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Team Chat" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-red-900/40 bg-red-950/30 text-red-200">
                        <MessageSquareText className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold text-foreground">{project.title}</h1>
                    </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                    <MessageArea project={project} />
                    <ChatInput project={project} />
                </div>
            </div>
        </AppLayout>
    );
}
