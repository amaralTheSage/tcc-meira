import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Edge } from '@xyflow/react';
import Board from './components/board';
import AppLayout from './visualizing-layout/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Traceboard',
        href: '#',
    },
];

export default function Traceboard({ template }: { template: any }) {
    const data = template.data;

    console.log(data);

    // const initialConnections = data.task_connections?.flatMap((task: any) => {
    //     const conns: Edge[] = [];

    //     if (task.targets || task.sources) {
    //         task.targets.map((target: any) => {
    //             conns.push({
    //                 id: `${crypto.randomUUID()}`,
    //                 source: target.pivot.source_id,
    //                 target: target.pivot.target_id,
    //                 animated: true,
    //                 type: 'bezier',
    //             });
    //         });
    //     }

    //     return conns;
    // });

    const connections = data.task_connections.flatMap((c) => {
        const conns: Edge[] = [];

        conns.push({
            id: `${crypto.randomUUID()}`,
            source: c.source_id,
            target: c.target_id,
            animated: true,
            type: 'bezier',
        });

        return conns;
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={{ id: template.id, name: template.name }}>
            <Head title="Traceboard" />
            <Board tasks={data.tasks} initialNotes={data.notes} project={data} initialConnections={connections} />
        </AppLayout>
    );
}
