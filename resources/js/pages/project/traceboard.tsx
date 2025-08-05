import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Edge } from '@xyflow/react';

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

    const initialConnections =
        project.tasks?.flatMap((task) => {
            const conns: Edge[] = [];

            if (task.targets || task.sources) {
                task.targets.map((target: any) => {
                    const isTargetCompleted = target?.data?.completed;

                    conns.push({
                        id: `${crypto.randomUUID()}`,
                        source: target.pivot.source_id,
                        target: target.pivot.target_id,
                        animated: project.animated_edges && !isTargetCompleted,
                        type: project.edge_type,
                    });
                });
            }

            return conns;
        }) ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <Board tasks={project.tasks} initialNotes={project.notes} project={project} initialConnections={initialConnections} />
        </AppLayout>
    );
}
