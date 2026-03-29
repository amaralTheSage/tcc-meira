import Board from '@/components/traceboard/board';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Edge } from '@xyflow/react';
import { useState, useMemo } from 'react';

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
        return project.tasks?.filter(t => t.sprint_id?.toString() === selectedSprint);
    }, [project.tasks, selectedSprint]);

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <div className="flex h-14 items-center justify-end px-6 border-b border-neutral-800 shrink-0 bg-background">
                <select
                    className="w-40 p-1 rounded-sm bg-neutral-700 cursor-pointer text-white text-sm"
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                >
                    <option value="">All Sprints</option>
                    {project.sprints?.map(sprint => (
                        <option key={sprint.id} value={sprint.id}>{sprint.title}</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 w-full relative">
                <Board 
                    key={selectedSprint} 
                    tasks={filteredTasks} 
                    initialNotes={project.notes} 
                    project={project} 
                    initialConnections={initialConnections.filter(edge => 
                        filteredTasks?.some(t => t.id === edge.source) && 
                        filteredTasks?.some(t => t.id === edge.target)
                    )} 
                />
            </div>
        </AppLayout>
    );
}
