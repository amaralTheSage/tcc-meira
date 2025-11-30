import TagsSubmenu from '@/components/traceboard/tags-submenu';
import { Column, ColumnTask, TaskSubtask, Tag } from "@/types/models";
import { useState } from "react";
import TaskUtilMenu from "./task-util-menu";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import TaskMenuModal from "./task-menu-modal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SubtaskContainer from "./subtasks-container";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuTrigger, ContextMenuSeparator, } from '@/components/ui/context-menu';

// Kanban Task container — props are typed inline below

export default function TaskContainer({ task, project_id, column }: { task: ColumnTask; project_id: string; column?: Column }) {
    const [modalMenuOpen, setModalMenuOpen] = useState(false);

    const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);

    const [creatingSubTask, setCreatingSubTask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const [imageUrl, setImageUrl] = useState<string | undefined>(task.image);
    const [tags, setTags] = useState<Tag[]>([]);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: 'Task',
            task,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    function deleteTask() {
        router.delete(route('tasks.destroy', { project: project_id, task_id: task.id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Task deleted successfuly');
            },
            onError: () => {
                toast.error('An error occurred when deleting the task.');
            },
        });
    }

    function removeImage() {
        // optimistic UI update
        setImageUrl(undefined);

        router.patch(
            route('tasks.update', { project: project_id, task: task.id }),
            { image_link: 'REMOVE_IMAGE' },
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('An error occurred when removing the image from the task.');
                    // revert optimistic update
                    setImageUrl(task.image);
                },
            },
        );
    }

    function createSubtask() {
        if (!newSubtaskTitle.trim()) return;

        const newSubtaskData = {
            id: crypto.randomUUID(),
            title: newSubtaskTitle.trim(),
            position: task.subtasks?.length ?? 0, // Use current subtasks count as position safely
        };
        router.post(
            route('subtasks.store', { project: project_id }),
            { ...newSubtaskData, task_id: task.id },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    let newSubtask = null;
                    if (page.props && typeof page.props === 'object') {
                        if ('newSubtask' in page.props) {
                            newSubtask = page.props.newSubtask;
                        } else if ('subtask' in page.props) {
                            newSubtask = page.props.subtask;
                        } else if ('id' in page.props) {
                            newSubtask = page.props;
                        }
                    }
                    if (!newSubtask) {
                        newSubtask = { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), position: task.subtasks?.length ?? 0 };
                    }
                    setSubtasks([...subtasks, newSubtask as TaskSubtask]);
                    setCreatingSubTask(false);
                    setNewSubtaskTitle('');
                    // Clear Subtasks to avoid duplicates if backend refreshes task.subtasks
                    setSubtasks([]);
                    toast.success('Subtask created successfuly');
                },
                onError: () => {
                    toast.error('An error occurred when creating the Subtask.');
                },
            },
        );
    }

    function startCreatingSubtask() {
        setCreatingSubTask(true);
        setNewSubtaskTitle('');
    }

    function cancelCreatingSubtask() {
        setCreatingSubTask(false);
        setNewSubtaskTitle('');
    }

    const combinedSubtasks = [...(task.subtasks || []), ...subtasks];

    const subtasks_container = combinedSubtasks.map((subtask, index) => <SubtaskContainer key={subtask.id} subtask={subtask} index={index} isDragging={isDragging}/>);

    return (
        <div className="flex flex-col relative">
            <ContextMenu>
                <ContextMenuTrigger>

                    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={` ${isDragging ? 'opacity-65 border-solid border-2 border-red-700' : ''} z-10 min-h-12 max-w-11/12 cursor-pointer bg-neutral-700 hover:border-solid border-solid gap-2 border-neutral-500 border-2 duration-75 hover:border-red-700 w-full rounded-md mb-0.5 p-1.5 flex flex-col items-center justify-between `} onClick={() => setModalMenuOpen(true)}>
                        {imageUrl && <img src={imageUrl} alt="Task" className="h-40 w-auto rounded object-cover" />}
    
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

                <ContextMenuContent className="w-56">
                    <ContextMenuSub>
                        <ContextMenuItem inset onSelect={() => setModalMenuOpen(true)}>
                            View / Rename
                        </ContextMenuItem>
                    </ContextMenuSub>

                    {imageUrl ? ( 
                        <ContextMenuItem inset onSelect={removeImage}>
                            Remove Image
                        </ContextMenuItem>
                    ) : (
                        <ContextMenuItem inset onSelect={(e) => {
                            e.preventDefault();
                            setModalOpen(true)
                        }}>
                            Add Image
                            
                        </ContextMenuItem>
                    )}

                    <TagsSubmenu
                        projectId={project_id}
                        initialTags={undefined}
                        task_id={task.id}
                        onSetTags={setTags}
                        tagsInUse={tags.map((t) => t.id)}
                    />

                    <ContextMenuItem
                        inset
                        onSelect={() => {
                            setCreatingSubTask(true);
                        }}
                    >
                        Add subtask
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    <ContextMenuItem variant="destructive" inset onSelect={() => deleteTask()}>
                        Delete Task
                    </ContextMenuItem>

                </ContextMenuContent>
            </ContextMenu>
            
            {task.subtasks && subtasks_container}

            {creatingSubTask && (
                <div className="float-right mb-2 ml-6 flex min-h-5 w-64 max-w-10/12 items-center rounded-md bg-neutral-600 p-2">
                    <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                createSubtask();
                            } else if (e.key === 'Escape') {
                                cancelCreatingSubtask();
                            }
                        }}
                        placeholder="Subtask title..."
                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                        autoFocus
                    />
                </div>
            )}



            {modalMenuOpen && (
                <TaskMenuModal
                    task={task}
                    newSubtaskTitle={newSubtaskTitle}
                    setNewSubtaskTitle={setNewSubtaskTitle}
                    creatingSubtask={creatingSubTask}
                    closeModal={setModalMenuOpen}
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
