import KanbanBoard from '@/components/kanban/kanban-board';
import KanbanFilter from '@/components/kanban/kanban-filter';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Column, Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Kanban({ project, columns }: { project: Project; columns: Column[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kanban',
            href: route('kanban', { project: project.id }),
        },
    ];

    const [column, setColumn] = useState(columns);

    useEffect(() => {
        setColumn(columns);
    }, [columns]);

    return (
        <div className='h-full'>  
            <AppLayout breadcrumbs={breadcrumbs} project={project}>
                <Head title="Kanban" />
                <div className='w-full flex flex-col'>
                    <KanbanBoard columns={column} setColumn={setColumn} project={project}/>
                </div>
            </AppLayout>
        </div>
    );
}
