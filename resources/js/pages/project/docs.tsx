import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';

export default function Docs({ project }: { project: Project }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Docs',
            href: route('docs', { project: project.id }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Kanban" />
        </AppLayout>
    );
}
