import { Column, ColumnTask, TaskSubtask } from "@/types/models";
import { useState } from "react";
import TaskUtilMenu from "./task-util-menu";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import TaskMenuModal from "./task-menu-modal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SubtaskContainer from "./subtasks-container";
import { ContextMenu, ContextMenuTrigger } from "@radix-ui/react-context-menu";

interface TaskContainerProps {
    task: ColumnTask;
    id: string;
    position: number;
    project_id: string;
}

export default function TaskContainer({ task, project_id, column }: { task: ColumnTask; project_id: string; column?: Column;}) {

    const [utilMenuOpen, setUtilMenuOpen] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);

    const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);

    const [creatingSubTask, setCreatingSubTask] = useState(false)
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

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

    function createSubtask(){
        if (!newSubtaskTitle.trim()) return;

        const newSubtaskData = { 
            id: crypto.randomUUID(), 
            title: newSubtaskTitle.trim(),
            position: (task.subtasks?.length) ?? 0 // Use current subtasks count as position safely
        };
        router.post(
            route('subtasks.store', {project: project_id}),
            {...newSubtaskData, task_id: task.id},
            {
                preserveScroll:true,
                onSuccess: (page) => {
                    let newSubtask = null;
                    if (page.props && typeof page.props === "object") {
                        if ("newSubtask" in page.props) {
                            newSubtask = page.props.newSubtask;
                        } else if ("subtask" in page.props) {
                            newSubtask = page.props.subtask;
                        } else if ("id" in page.props) {
                            newSubtask = page.props;
                        }
                    }
                    if (!newSubtask) {
                        newSubtask = { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), position: task.subtasks?.length ?? 0 };
                    }
                    setSubtasks([...subtasks, newSubtask as TaskSubtask]);
                    setCreatingSubTask(false);
                    setNewSubtaskTitle("");
                    // Clear Subtasks to avoid duplicates if backend refreshes task.subtasks
                    setSubtasks([]);
                    toast.success("Subtask created successfuly");
                },
                onError: () => {
                    toast.error('An error occurred when creating the Subtask.');
                }
            }
        )
    }

    function startCreatingSubtask(){
        setCreatingSubTask(true);
        setNewSubtaskTitle("");
    }

    function cancelCreatingSubtask(){
        setCreatingSubTask(false);
        setNewSubtaskTitle("");
    }

    const combinedSubtasks = [...(task.subtasks || []), ...subtasks];

    const subtasks_container = combinedSubtasks.map((subtask) => (
        <SubtaskContainer key={subtask.id} subtask={subtask} />
    ))

    return (
        <div className="flex flex-col relative">
            <ContextMenu>
                <ContextMenuTrigger>

                    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={` ${isDragging ? 'opacity-65 border-solid border-2 border-red-700' : ''} z-10 min-h-12 max-w-11/12 cursor-pointer bg-neutral-700 hover:border-solid border-solid gap-2 border-neutral-500 border-2 duration-75 hover:border-red-700 w-full rounded-md mb-0.5 p-1.5 flex flex-col items-center justify-between `} onClick={() => setModalOpen(true)}>
                        {task.image && (
                            <img src={task.image} alt="Task" className="h-40 w-auto object-cover rounded" />
                        )}
    
                        <div className="w-full flex items-center justify-between mb-2">
                            <span className="truncate px-2.5">{task.title || "Untitled Task"}</span>     
                        </div>
                    
                        <div className="flex justify-between w-full">
                    
                            <div className="flex items-center w-full">
                                {task.tags && task.tags.length > 0 && (
                                    <div className="w-full flex flex-wrap gap-1 px-1 mt-1">
                                        {task.tags.map(tag => (
                                            <span
                                                key={tag.id}
                                                className="text-xs px-2 py-0.5 rounded-md"
                                                style={{ backgroundColor: tag.color }}
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
    
                                {task.users?.map((user) => (
                                    <img className="rounded-full w-7 cursor-pointer float-right" src={user.avatar} alt={user.name} />
                                ))
                                }
                            </div>
                        </div>
                            
                    </div>
                </ContextMenuTrigger>
            </ContextMenu>
            
            {task.subtasks &&
                
                subtasks_container
               
            }


            {modalOpen && (
                <TaskMenuModal
                    task={task}
                    newSubtaskTitle={newSubtaskTitle}
                    setNewSubtaskTitle={setNewSubtaskTitle}
                    creatingSubtask={creatingSubTask}
                    closeModal={setModalOpen}
                    column={column}
                    subtasks={combinedSubtasks}
                    createSubtask={createSubtask}
                    cancelCreatingSubtask={cancelCreatingSubtask}
                    startCreatingSubtask={startCreatingSubtask}
                    project_id={project_id}
                />
            )}


        </div>
    );
}

