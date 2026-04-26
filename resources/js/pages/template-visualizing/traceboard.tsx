import { type BreadcrumbItem } from '@/types';
import { Project, Template } from '@/types/models';
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

export default function Traceboard({ template }: { template: Template }) {
    const data = template.data;

    // const initialConnections = data.task_connections?.flatMap((task: TemplateTaskConnection) => {
    //     const conns: Edge[] = [];

    //     if (task.targets || task.sources) {
    //         task.targets.map((target: TemplateTaskConnection) => {
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

    const previewProject: Project = {
        id: template.id,
        title: template.name,
        members: [],
        edge_type: 'bezier',
        animated_edges: true,
    };

    const connections = (data.task_connections ?? []).flatMap((c) => {
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
        <AppLayout breadcrumbs={breadcrumbs} project={previewProject}>
            <Head title="Traceboard" />
            <Board tasks={data.tasks} initialNotes={data.notes} project={previewProject} initialConnections={connections} />
        </AppLayout>
    );
}
