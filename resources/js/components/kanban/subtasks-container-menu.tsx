import { TaskSubtask } from '@/types/models';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import SubtaskUtilMenu from './subtask-util-menu';

export default function SubtaskContainerMenu({ subtask, project_id }: { subtask: TaskSubtask; project_id: string }) {
    const [utilMenuOpen, setUtilMenuOpen] = useState(false);

    function deleteSubtask() {
        router.delete(route('subtasks.destroy', { project: project_id, subtask_id: subtask.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('subtask deleted successfuly');
            },
            onError: () => {
                toast.error('An error occurred when deleting the Subtask.');
            },
        });
    }

    return (
        <div className="relative mb-0.5 flex items-center gap-2 border-2 border-x-0 border-solid border-neutral-500 pl-4">
            <input
                className="h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-solid border-red-700 bg-transparent checked:bg-red-600"
                type="checkbox"
                name="check_completed"
                id="check_completed"
            />
            <div className="flex min-h-5 w-full max-w-11/12 items-center rounded-md p-1.5 duration-75">
                <div className="flex w-full items-center justify-between pl-2">
                    <span className="truncate">{subtask.title || 'Untitled Task'}</span>
                    <i
                        className="fa-solid fa-ellipsis-vertical fa-lg cursor-pointer hover:text-red-700"
                        onClick={(e) => {
                            e.stopPropagation();
                            setUtilMenuOpen(!utilMenuOpen);
                        }}
                    ></i>
                </div>
            </div>
            {utilMenuOpen && <SubtaskUtilMenu onDelete={deleteSubtask} />}
        </div>
    );
}
