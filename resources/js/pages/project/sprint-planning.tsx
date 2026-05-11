import SprintBoard from '@/components/sprint-planner/sprint-board';
import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import SprintTasksModal from '@/components/sprint-planner/sprint-tasks-modal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ColumnTask, Project, Sprint } from '@/types/models';
import { Head, router } from '@inertiajs/react';
import { CalendarCheck2, Plus } from 'lucide-react';
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
    const [taskSelectionSprintId, setTaskSelectionSprintId] = useState<string | null>(null);
    const [editingSprint, setEditingSprint] = useState<Sprint | undefined>(undefined);
    const [deletingSprint, setDeletingSprint] = useState<Sprint | undefined>(undefined);

    useEffect(() => {
        if (newSprint) {
            setShowCreationDialog(false);
            setTaskSelectionSprintId(newSprint.id);
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
        router.delete(route('sprint.destroy', { project: project.id, sprint: sprintId }));
        setDeletingSprint(undefined);
    };

    const handleStartSprint = (sprintId: string) => {
        router.patch(route('sprint.start', { project: project.id, sprint: sprintId }));
    };

    const handleCompleteSprint = (sprintId: string) => {
        router.patch(route('sprint.complete', { project: project.id, sprint: sprintId }));
    };

    const handleSelectSprintTasks = (sprintId: string) => {
        setTaskSelectionSprintId(sprintId);
        setShowTasksModal(true);
    };

    const openCreateSprintDialog = () => {
        setEditingSprint(undefined);
        setShowCreationDialog(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Sprint" />

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <div className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-red-900/40 bg-red-950/30 text-red-200">
                            <CalendarCheck2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="truncate text-lg font-semibold text-foreground">{project.title}</h1>
                            <p className="text-xs text-muted-foreground">{project.sprints.length} sprints</p>
                        </div>
                    </div>
                </div>

                <div className="pointer-events-none fixed right-5 bottom-7 z-20 md:right-8 md:bottom-8">
                    <Button
                        data-testid="sprint-new-trigger"
                        type="button"
                        onClick={openCreateSprintDialog}
                        className="pointer-events-auto h-11 rounded-full border border-red-300/20 bg-[#b91c1c] px-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(185,28,28,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#dc2626] hover:shadow-[0_22px_55px_rgba(185,28,28,0.4)] focus-visible:ring-red-500/40 active:translate-y-0 active:scale-[0.97] active:bg-[#7f1d1d]"
                    >
                        <Plus className="size-4" />
                        New sprint
                    </Button>
                </div>

                <SprintCreationDialog
                    open={showCreationDialog}
                    onOpenChange={setShowCreationDialog}
                    onSubmit={handleSprintCreate}
                    project_id={project.id}
                    sprint={editingSprint}
                    sprints={project.sprints}
                />

                <SprintTasksModal open={showTasksModal} onOpenChange={setShowTasksModal} tasks={tasks} sprintId={taskSelectionSprintId} />

                <AlertDialog open={Boolean(deletingSprint)} onOpenChange={(open) => !open && setDeletingSprint(undefined)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete sprint</AlertDialogTitle>
                            <AlertDialogDescription>
                                Delete {deletingSprint?.title ?? 'this sprint'} and remove its task assignments. This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                data-testid="sprint-delete-confirm"
                                onClick={() => deletingSprint && handleDeleteSprint(deletingSprint.id)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                Delete sprint
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <div className="min-h-0 flex-1 p-6">
                    <SprintBoard
                        projectId={project.id}
                        sprints={project.sprints}
                        onComplete={handleCompleteSprint}
                        onDelete={setDeletingSprint}
                        onEdit={handleEditSprint}
                        onSelectTasks={handleSelectSprintTasks}
                        onStart={handleStartSprint}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
