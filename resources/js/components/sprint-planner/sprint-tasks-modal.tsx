import { router } from '@inertiajs/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnTask } from '@/types/models';

interface SprintTasksModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: ColumnTask[];
    sprintId: string | null;
}

export function SprintTasksModal({ open, onOpenChange, tasks, sprintId }: SprintTasksModalProps) {
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const currentSprintTaskIds = React.useMemo(() => {
        if (!sprintId) return [];

        return tasks.filter((task) => task.sprint_id === sprintId).map((task) => task.id);
    }, [sprintId, tasks]);

    React.useEffect(() => {
        if (open) {
            setSelectedTaskIds(currentSprintTaskIds);
        }
    }, [currentSprintTaskIds, open]);

    const hasSelectionChanges = React.useMemo(() => {
        if (currentSprintTaskIds.length !== selectedTaskIds.length) return true;

        return currentSprintTaskIds.some((taskId) => !selectedTaskIds.includes(taskId));
    }, [currentSprintTaskIds, selectedTaskIds]);

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskIds((prevSelectedTaskIds) => {
            if (prevSelectedTaskIds.includes(taskId)) {
                return prevSelectedTaskIds.filter((id) => id !== taskId);
            } else {
                return [...prevSelectedTaskIds, taskId];
            }
        });
    };

    const handleAttachTasks = () => {
        if (sprintId) {
            router.post(
                route('sprint.attach-tasks', { sprint: sprintId }),
                {
                    task_ids: selectedTaskIds,
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                    },
                    preserveState: true,
                },
            );
        }
    };

    const filteredTasks = tasks.filter(
        (task) =>
            task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="border-border/70 bg-background">
                <div className="flex h-[80vh] flex-col">
                    <DrawerHeader data-testid="sprint-task-modal">
                        <DrawerTitle>Select tasks</DrawerTitle>
                        <DrawerDescription>Select tasks that will be part of the sprint</DrawerDescription>
                    </DrawerHeader>

                    <div className="max-w-md px-8 py-4">
                        <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="custom-scrollbar w-full flex-grow overflow-y-auto bg-background p-8">
                        <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className="mb-4 break-inside-avoid">
                                    <div
                                        data-testid={`sprint-task-option-${task.id}`}
                                        className={cn(
                                            'cursor-pointer overflow-hidden rounded-md bg-sidebar/60 transition-all duration-300',
                                            selectedTaskIds.includes(task.id)
                                                ? 'border border-red-700/80 shadow-lg shadow-red-950/30'
                                                : 'border border-border/70 hover:border-red-900/60 hover:bg-muted/40',
                                        )}
                                        onClick={() => handleTaskClick(task.id)}
                                    >
                                        {task.image && <img src={task.image} alt={task.title} className="h-auto w-full object-cover" />}
                                        <div className="p-4">
                                            <h3 className="mb-2 text-base font-bold text-foreground">{task.title}</h3>
                                            <p className="text-sm leading-relaxed text-muted-foreground">{task.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DrawerFooter className="border-t border-border/70 bg-background">
                        <Button
                            data-testid="sprint-attach-tasks"
                            variant="destructive"
                            onClick={handleAttachTasks}
                            disabled={!sprintId || !hasSelectionChanges}
                        >
                            Save {selectedTaskIds.length} {selectedTaskIds.length == 1 ? 'task' : 'tasks'} in sprint
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default SprintTasksModal;
