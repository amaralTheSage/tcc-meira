import SprintBoard from '@/components/sprint-planner/sprint-board';
import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import SprintTasksModal from '@/components/sprint-planner/sprint-tasks-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    project: Project;
}

export default function SprintPlanning({ project }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sprint',
            href: route('sprint.index', { project: project.id }),
        },
    ];

    const [showCreationDialog, setShowCreationDialog] = useState(false);
    const [showTasksModal, setShowTasksModal] = useState(false);

    const handleSprintCreate = () => {
        setShowCreationDialog(false);
        setShowTasksModal(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Sprint" />

            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 transform rounded-t-2xl bg-sidebar p-2">
                <Button onClick={() => setShowCreationDialog(true)}>New sprint</Button>
            </div>

            <SprintCreationDialog
                open={showCreationDialog}
                onOpenChange={setShowCreationDialog}
                onSubmit={handleSprintCreate}
            />

            <SprintTasksModal open={showTasksModal} onOpenChange={setShowTasksModal} />

            <Separator className="mx-2 mb-5" />

            <SprintBoard />
        </AppLayout>
    );
}
