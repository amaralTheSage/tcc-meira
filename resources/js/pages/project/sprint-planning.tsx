import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Project } from '@/types/models';
import SprintBoard from '@/components/sprint-planner/sprint-board';

interface Props {
    project: Project
}

export default function SprintPlanning({ project }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sprint',
            href: route('sprint.index', { project: project.id }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Sprint" />
            <SprintBoard />
        </AppLayout>
    );
}
