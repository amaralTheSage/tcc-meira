import SprintBoard from '@/components/sprint-planner/sprint-board';
import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import SprintTasksModal from '@/components/sprint-planner/sprint-tasks-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ColumnTask, Project, Sprint } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Props {
    project: Project & {
        sprints: (Sprint & { tasks: ColumnTask[] })[];
    };
    tasks: ColumnTask[];
    newSprint?: Sprint;
}

export default function SprintPlanning({ project, tasks, newSprint }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sprint',
            href: route('sprint.index', { project: project.id }),
        },
    ];

    const [showCreationDialog, setShowCreationDialog] = useState(false);
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [newSprintId, setNewSprintId] = useState<string | null>(null);
    const [editingSprint, setEditingSprint] = useState<Sprint | undefined>(undefined);

    useEffect(() => {
        if (newSprint) {
            setShowCreationDialog(false);
            setNewSprintId(newSprint.id);
            setShowTasksModal(true);
        }
    }, [newSprint]);

    const handleSprintCreate = () => {
        setShowCreationDialog(false);
        setEditingSprint(undefined);
    };

    const handleEditSprint = (sprint: Sprint) => {
        setEditingSprint(sprint);
        setShowCreationDialog(true);
    };

    const handleDeleteSprint = (sprintId: string) => {
        if (confirm('Are you sure you want to delete this sprint? Tasks will be unassigned.')) {
            router.delete(route('sprint.destroy', { project: project.id, sprint: sprintId }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Sprint" />

            <div className="fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform rounded-t-2xl bg-sidebar p-2 opacity-70 transition-all duration-300 hover:p-4 hover:opacity-100">
                <Button
                    variant="destructive"
                    onClick={() => {
                        setEditingSprint(undefined);
                        setShowCreationDialog(true);
                    }}
                >
                    New sprint
                </Button>
            </div>

            <SprintCreationDialog
                open={showCreationDialog}
                onOpenChange={setShowCreationDialog}
                onSubmit={handleSprintCreate}
                project_id={project.id}
                sprint={editingSprint}
            />

            <SprintTasksModal open={showTasksModal} onOpenChange={setShowTasksModal} tasks={tasks} sprintId={newSprintId} />

            <Separator className="mx-2 mb-5" />

            <div className="custom-scrollbar flex w-full gap-4 overflow-x-auto px-4 pb-4">
                {project.sprints?.map((sprint) => (
                    <div key={sprint.id} className="min-w-64 shrink-0 rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-sm">
                        <div className="mb-1 flex items-start justify-between">
                            <h3 className="font-bold text-white">{sprint.title}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditSprint(sprint)}
                                    className="cursor-pointer text-neutral-500 transition-colors hover:text-white"
                                >
                                    <i className="fa-solid fa-pencil text-[10px]"></i>
                                </button>
                                <button
                                    onClick={() => handleDeleteSprint(sprint.id)}
                                    className="cursor-pointer text-neutral-500 transition-colors hover:text-red-500"
                                >
                                    <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                        <p
                            className={`mb-4 w-fit rounded px-2 py-0.5 text-[10px] font-semibold ${
                                sprint.status === 'planned'
                                    ? 'bg-neutral-800 text-neutral-400'
                                    : sprint.status === 'active'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : 'bg-green-500/10 text-green-500'
                            }`}
                        >
                            {sprint.status?.toUpperCase() || 'PLANNED'}
                        </p>
                        {(!sprint.status || sprint.status === 'planned') && (
                            <Button
                                variant="secondary"
                                className="w-full text-xs"
                                onClick={() => router.patch(route('sprint.start', { project: project.id, sprint: sprint.id }))}
                            >
                                Start Sprint
                            </Button>
                        )}
                        {sprint.status === 'active' && (
                            <Button
                                variant="default"
                                className="w-full text-xs"
                                onClick={() => router.patch(route('sprint.complete', { project: project.id, sprint: sprint.id }))}
                            >
                                Complete Sprint
                            </Button>
                        )}
                        {sprint.status === 'completed' && (
                            <Button variant="outline" className="w-full cursor-not-allowed text-xs opacity-50">
                                Completed
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <SprintBoard sprints={project.sprints} />
        </AppLayout>
    );
}
