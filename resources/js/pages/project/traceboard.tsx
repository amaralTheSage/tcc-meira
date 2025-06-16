import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Traceboard',
        href: '/traceboard',
    },
];

export default function Traceboard({ project }: { project: Project }) {
    // useEcho('canvas', 'CanvasUpdatedEvent', (e) => {
    //     console.log(e);
    // });

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <Board tasks={project.tasks} project={project} />
        </AppLayout>
    );
}
