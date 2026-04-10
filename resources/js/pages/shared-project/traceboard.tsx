import Board from '@/pages/template-visualizing/components/board';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Edge } from '@xyflow/react';
import SharedProjectLayout from './layout';

export default function SharedTraceboard({ project }: { project: Project }) {
    const connections = projectConnections(project);

    return (
        <SharedProjectLayout active="traceboard" project={project}>
            <Head title={`${project.title} Traceboard`} />
            <div className="relative h-[calc(100vh-13rem)] w-full">
                <Board tasks={project.tasks} initialNotes={project.notes} project={project} initialConnections={connections} />
            </div>
        </SharedProjectLayout>
    );
}

function projectConnections(project: Project): Edge[] {
    return (
        project.tasks?.flatMap((task) =>
            (task.targets ?? []).map((target) => ({
                id: `${target.pivot.source_id}-${target.pivot.target_id}`,
                source: target.pivot.source_id,
                target: target.pivot.target_id,
                animated: project.animated_edges,
                type: project.edge_type,
            })),
        ) ?? []
    );
}
