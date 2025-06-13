import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { TraceboardTask } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Traceboard',
        href: '/traceboard',
    },
];

export default function Traceboard({ tasks, project }: { tasks: TraceboardTask[] }) {
    // useEcho('canvas', 'CanvasUpdatedEvent', (e) => {
    //     console.log(e);
    // });

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <Board tasks={tasks} project={project} />
        </AppLayout>
    );
}
