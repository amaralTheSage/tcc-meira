import { Column, ColumnTask } from "@/types/models";
import { useState } from "react";
import TaskUtilMenu from "./task-util-menu";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import TaskMenuModal from "./task-menu-modal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskContainerProps {
    task: ColumnTask;
    id: string;
    position: number;
    project_id: string;
}

export default function TaskContainer({ task, id, position, project_id, column }: { task: ColumnTask; id: string; position: number; project_id: string; column?: Column }) {

    const [utilMenuOpen, setUtilMenuOpen] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);

    const { setNodeRef, attributes, listeners,
             transform, transition, isDragging } =
             useSortable({
                id: task.id,
                data: {
                    type: "Task",
                    task
                },

            })

        const style = {
            transform: CSS.Transform.toString(transform),
            transition
        };

    function deleteTask() {
        router.delete(
            route('tasks.destroy', { project: project_id, task_id: task.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Task deleted successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when deleting the task.');
                }
            }
        );
    }

    return (
        <div className="flex relative" onClick={(e) => { if (!(e.target as HTMLElement).closest('.fa-ellipsis-vertical')) setUtilMenuOpen(false); }}>
            <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={` ${isDragging ? 'opacity-65 border-solid border-2 border-red-700' : ''} min-h-10 max-w-56 cursor-pointer bg-neutral-700 hover:border-solid border-none border-2 duration-75 border-red-700 w-full rounded-md mb-2 p-2 flex items-center justify-between `} onClick={() => setModalOpen(true)}>
                <span>{task.title || "Untitled Task"}</span>

                <i className="fa-solid fa-ellipsis-vertical fa-lg cursor-pointer hover:text-red-700" onClick={(e) => { e.stopPropagation(); setUtilMenuOpen(!utilMenuOpen); }}></i>
            </div>

            {utilMenuOpen &&
                (
                    <TaskUtilMenu onDelete={deleteTask} />
                )
            }

            {modalOpen && (
                <TaskMenuModal task={task} closeModal={setModalOpen} column={column}/>
            )}
        </div>
    );
}

