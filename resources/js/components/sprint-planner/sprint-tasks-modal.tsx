import { router } from '@inertiajs/react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ColumnTask, Sprint } from '@/types/models';

interface SprintTasksModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tasks: ColumnTask[];
    sprintId: number | null;
}

export function SprintTasksModal({ open, onOpenChange, tasks, sprintId }: SprintTasksModalProps) {
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');

    const handleTaskClick = (taskId: string) => {
        setSelectedTaskIds(prevSelectedTaskIds => {
            if (prevSelectedTaskIds.includes(taskId)) {
                return prevSelectedTaskIds.filter(id => id !== taskId);
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
        task =>
            task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())),
    );

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="h-[80vh] flex flex-col">
                    <DrawerHeader>
                        <DrawerTitle>Select tasks</DrawerTitle>
                        <DrawerDescription>Select tasks that will be part of the sprint</DrawerDescription>
                    </DrawerHeader>

                    <div className="px-8 py-4 max-w-md ">
                        <Input
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-grow bg-primary-foreground overflow-y-auto w-full p-8">
                        <div className="columns-1  sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                            {filteredTasks.map(task => (
                                <div key={task.id} className="break-inside-avoid mb-4">
                                    <div
                                        className={cn(
                                            'bg-black rounded-xl overflow-hidden transition-all duration-300 cursor-pointer',
                                            selectedTaskIds.includes(task.id)
                                                ? 'border border-red-500 shadow-lg shadow-red-500/30'
                                                : 'border border-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10',
                                        )}
                                        onClick={() => handleTaskClick(task.id)}
                                    >
                                        {task.image && (
                                            <img
                                                src={task.image}
                                                alt={task.title}
                                                className="w-full h-auto object-cover"
                                            />
                                        )}
                                        <div className="p-4">
                                            <h3 className="font-bold text-base text-slate-100 mb-2">{task.title}</h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">{task.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DrawerFooter className="fixed bottom-0 w-sm">
                        <Button variant='destructive' onClick={handleAttachTasks} disabled={selectedTaskIds.length === 0}>
                            Attach {selectedTaskIds.length} {selectedTaskIds.length == 1 ? 'task' : 'tasks'} to
                            sprint
                        </Button>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

export default SprintTasksModal;
