import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DndContext } from '@dnd-kit/core';
import { Head } from '@inertiajs/react';
import KanbanBoard from '@/components/kanban/kanban-board';
import { Column, Project } from '@/types/models';
import { useState } from 'react';

export default function Kanban({ project, columns } : {project: Project, columns: Column[]} ) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kanban',
            href: route('kanban', { project: project.id }),
        },
    ];

    const [column, setColumn] = useState(columns);



    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Kanban" />
            <KanbanBoard columns={column} setColumn={setColumn}/>
        </AppLayout>
    );
}
