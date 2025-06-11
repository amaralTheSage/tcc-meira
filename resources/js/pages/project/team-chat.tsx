import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Team Chat',
        href: '/team-chat',
    },
];

export default function TeamChat({project}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Team Chat'," />
        </AppLayout>
    );
}
