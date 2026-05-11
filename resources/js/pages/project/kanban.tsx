import KanbanBoard from '@/components/kanban/kanban-board';
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
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Kanban" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <KanbanBoard columns={column} setColumn={setColumn} project={project} />
            </div>
        </AppLayout>
    );
}
