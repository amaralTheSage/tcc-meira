import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Edge } from '@xyflow/react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Traceboard',
        href: '/traceboard',
    },
];

export default function Traceboard({ project }: { project: Project }) {
    const initialConnections =
        project.tasks?.flatMap((task) => {
            const conns: Edge[] = [];

            if (task.targets || task.sources) {
                (task.targets as any[]).map((target: any) => {
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

    const [selectedSprint, setSelectedSprint] = useState('');

    const filteredTasks = useMemo(() => {
        if (!selectedSprint) return project.tasks;
        return project.tasks?.filter((t) => t.sprint_id?.toString() === selectedSprint);
    }, [project.tasks, selectedSprint]);

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <div className="flex h-14 shrink-0 items-center justify-end border-b border-neutral-800 bg-background px-6">
                <select
                    className="w-40 cursor-pointer rounded-sm bg-neutral-700 p-1 text-sm text-white"
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                >
                    <option value="">All Sprints</option>
                    {project.sprints?.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                            {sprint.title}
                        </option>
                    ))}
                </select>
            </div>
            <div className="relative w-full flex-1">
                <Board
                    key={selectedSprint}
                    tasks={filteredTasks}
                    initialNotes={project.notes}
                    project={project}
                    initialConnections={initialConnections.filter(
                        (edge) => filteredTasks?.some((t) => t.id === edge.source) && filteredTasks?.some((t) => t.id === edge.target),
                    )}
                />
            </div>
        </AppLayout>
    );
}
