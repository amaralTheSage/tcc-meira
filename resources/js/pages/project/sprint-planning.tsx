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

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Sprint" />

            <div className="fixed bottom-0 left-1/2 z-10 -translate-x-1/2 transform rounded-t-2xl bg-sidebar p-2 opacity-70 transition-all duration-300 hover:p-4 hover:opacity-100">
                <Button
                    data-testid="sprint-new-trigger"
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

            <Separator className="mx-2 mb-5" />

            <SprintBoard
                projectId={project.id}
                sprints={project.sprints}
                onComplete={handleCompleteSprint}
                onDelete={setDeletingSprint}
                onEdit={handleEditSprint}
                onSelectTasks={handleSelectSprintTasks}
                onStart={handleStartSprint}
            />
        </AppLayout>
    );
}
