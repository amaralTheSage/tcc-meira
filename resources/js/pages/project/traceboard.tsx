import Board from '@/components/traceboard/board';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sprintAccentStyle } from '@/lib/sprint-colors';
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

const ALL_SPRINTS_FILTER_VALUE = 'all-sprints';

export default function Traceboard({ project }: { project: Project }) {
    const initialConnections =
        project.tasks?.flatMap((task) => {
            const conns: Edge[] = [];

            if (task.targets) {
                task.targets.forEach((target) => {
                    const isTargetCompleted = target.data?.completed || target.status === 'completed';

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

    const initialSprintFilter = useMemo(
        () => getInitialSprintFilter(project.sprints, typeof window === 'undefined' ? '' : window.location.search),
        [project.sprints],
    );
    const [selectedSprint, setSelectedSprint] = useState(initialSprintFilter);

    const filteredTasks = useMemo(() => {
        if (selectedSprint === ALL_SPRINTS_FILTER_VALUE) return project.tasks;
        return project.tasks?.filter((t) => t.sprint_id?.toString() === selectedSprint);
    }, [project.tasks, selectedSprint]);

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Traceboard" />
            <div className="flex h-14 shrink-0 items-center justify-end border-b border-neutral-800 bg-background px-6">
                <Select value={selectedSprint} onValueChange={setSelectedSprint}>
                    <SelectTrigger data-testid="traceboard-sprint-filter" className="w-40 cursor-pointer bg-neutral-700 text-white shadow-none">
                        <SelectValue placeholder="All Sprints" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_SPRINTS_FILTER_VALUE}>All Sprints</SelectItem>
                        {project.sprints?.map((sprint) => (
                            <SelectItem key={sprint.id} value={sprint.id}>
                                <span
                                    aria-hidden
                                    className="size-2 rounded-full"
                                    data-testid={`traceboard-sprint-color-${sprint.id}`}
                                    style={sprintAccentStyle(sprint.color)}
                                />
                                {sprint.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
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

export function getInitialSprintFilter(sprints: Project['sprints'], search: string): string {
    const requestedSprintId = new URLSearchParams(search).get('sprint');
    if (!requestedSprintId) return ALL_SPRINTS_FILTER_VALUE;

    return sprints?.some((sprint) => sprint.id === requestedSprintId) ? requestedSprintId : ALL_SPRINTS_FILTER_VALUE;
}
