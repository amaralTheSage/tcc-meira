import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DndContext } from '@dnd-kit/core';
import { Head } from '@inertiajs/react';
import KanbanBoard from '@/components/kanban/kanban-board';
import { Column, Project } from '@/types/models';
import { useEffect, useState } from 'react';
import KanbanFilter from '@/components/kanban/kanban-filter';

export default function Kanban({ project, columns } : {project: Project, columns: Column[]} ) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kanban',
            href: route('kanban', { project: project.id }),
        },
    ];

    const [column, setColumn] = useState(columns);

    useEffect(() => {
        setColumn(columns)
    }, [columns])

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Kanban" />
            <div className='w-full h-full flex flex-col gap-2 p-4'>
                <h1 className='text-5xl ml-20 capitalize'>{project.title}</h1>
                <KanbanBoard columns={column} setColumn={setColumn} project={project}/>
            </div>
            
        </AppLayout>
    );
}
