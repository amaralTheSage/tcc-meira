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
        if (sprintId && selectedTaskIds.length > 0) {
            router.post(
                route('sprint.attach-tasks', { sprint: sprintId }),
                {
                    task_ids: selectedTaskIds,
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        setSelectedTaskIds([]);
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
            <DrawerContent>
                <div className="flex h-[80vh] flex-col">
                    <DrawerHeader>
                        <DrawerTitle>Select tasks</DrawerTitle>
                        <DrawerDescription>Select tasks that will be part of the sprint</DrawerDescription>
                    </DrawerHeader>

                    <div className="max-w-md px-8 py-4">
                        <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="w-full flex-grow overflow-y-auto bg-primary-foreground p-8">
                        <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3 xl:columns-4">
                            {filteredTasks.map((task) => (
                                <div key={task.id} className="mb-4 break-inside-avoid">
                                    <div
                                        className={cn(
                                            'cursor-pointer overflow-hidden rounded-xl bg-black transition-all duration-300',
                                            selectedTaskIds.includes(task.id)
                                                ? 'border border-red-500 shadow-lg shadow-red-500/30'
                                                : 'border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10',
                                        )}
                                        onClick={() => handleTaskClick(task.id)}
                                    >
                                        {task.image && <img src={task.image} alt={task.title} className="h-auto w-full object-cover" />}
                                        <div className="p-4">
                                            <h3 className="mb-2 text-base font-bold text-slate-100">{task.title}</h3>
                                            <p className="text-sm leading-relaxed text-slate-500">{task.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DrawerFooter className="fixed bottom-0 w-sm">
                        <Button variant="destructive" onClick={handleAttachTasks} disabled={selectedTaskIds.length === 0}>
                            Attach {selectedTaskIds.length} {selectedTaskIds.length == 1 ? 'task' : 'tasks'} to sprint
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default SprintTasksModal;
