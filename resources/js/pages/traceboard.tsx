import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { TraceboardTask } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Traceboard',
        href: '/Traceboard',
    },
];

export default function Traceboard({ tasks }: { tasks: TraceboardTask[] }) {
    useEcho('canvas', 'CanvasUpdatedEvent', (e) => {
        console.log(e);
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Traceboard" />
            <Board tasks={tasks} />
        </AppLayout>
    );
}
