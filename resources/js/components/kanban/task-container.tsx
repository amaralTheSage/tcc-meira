import TagsSubmenu from '@/components/traceboard/tags-submenu';
import { Column, ColumnTask, TaskSubtask, Tag, Project } from "@/types/models";
import { useState } from "react";
import { useInitials } from '@/hooks/use-initials';
import { router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import TaskMenuModal from "./task-menu-modal";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import SubtaskContainer from "./subtasks-container";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuTrigger, ContextMenuSeparator, } from '@/components/ui/context-menu';
import { Input, Button } from '@headlessui/react';
import { UploadIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { AvatarFallback, AvatarImage, Avatar } from '../ui/avatar';
import { useEcho } from "@laravel/echo-react";

// Kanban Task container — props are typed inline below

export default function TaskContainer({ task, project_id, column, project }: { task: ColumnTask; project_id: string; column?: Column; project: Project }) {
    const [modalMenuOpen, setModalMenuOpen] = useState(false);

    const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);

    const getInitials = useInitials();

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const { data, setData } = useForm<{ image?: File; image_link?: string }>();

    const [creatingSubTask, setCreatingSubTask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const [imageUrl, setImageUrl] = useState<string | undefined>(task.image);
    const [tags, setTags] = useState<Tag[]>([]);

    useEcho<{ taskId: string; image: string }>('tasks', 'TaskImageUpdated', (payload) => {
        if (payload.taskId === task.id) {
            setImageUrl(payload.image);
        }
    });

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


    function addImage(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        router.post(
            route('tasks.update', { project: task?.project_id, task: task?.id }),
            {
                ...data,
                _method: 'PATCH',
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Image added successfully');
                    setImageModalOpen(false);
                    setData({});
                    const imageUrl = data.image_link || (data.image ? URL.createObjectURL(data.image) : null);
                },
                onError: (errors) => {
                    toast.error('An error occurred when adding an image to a task.');
                    console.error(errors);
                },
            },
        );
    }

    const combinedSubtasks = [...(task.subtasks || []), ...subtasks];

    const subtasks_container = combinedSubtasks.map((subtask, index) => <SubtaskContainer key={subtask.id} subtask={subtask} index={index} isDragging={isDragging}/>);

    return (
        <div className="flex flex-col relative">
            <ContextMenu>
                <ContextMenuTrigger>

                    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={` ${isDragging ? 'opacity-65 border-solid border-2 border-red-700' : ''} z-10 min-h-12 cursor-pointer bg-black hover:border-solid gap-2 hover:border-2 duration-75 hover:border-red-700 w-[98%] rounded-md mb-0.5 p-1.5 flex flex-col items-center justify-between `} onClick={() => setModalMenuOpen(true)}>
                        <div>
                            {imageUrl && <img src={imageUrl} alt="Task" className="h-40 wrap w-auto rounded object-cover" />}
                            {task.sprint_id && (
                                <div className="flex px-1 mt-1">
                                    <span 
                                        className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.get(route('sprint.index', { project: project_id }));
                                        }}
                                    >
                                        {project.sprints?.find(s => String(s.id) === String(task.sprint_id))?.title || 'Sprint'}
                                    </span>
                                </div>
                            )}
                          
                                <div className="flex flex-wrap gap-1 px-1 mt-1 float-end">
                                    {task.tags?.slice(0, 2).map((tag) => (
                                        <span key={tag.id} style={{ backgroundColor: tag.color }} className="rounded-xl px-4 text-sm text-primary-foreground">
                                            {tag.name}
                                        </span>
                                    ))}
                                    {task.tags && task.tags.length > 2 && (
                                        <span style={{ backgroundColor: task.tags[2].color }} className="rounded-xl px-4 text-sm text-primary-foreground">
                                            +{task.tags.length - 2}
                                        </span>
                                    )}
                                </div>
                                
                        </div>

                        <div className="w-full flex items-center mb-2">
                            {task.status == 'completed' && <i className="fa-solid fa-circle-check text-green-500"></i>}
                            <span className="truncate px-2.5 text-wrap">{task.title || "Untitled Task"}</span>     
                        </div>
                    
                        <div className="flex justify-between w-full">
                    
                            <div className="flex items-center justify-between w-full">
                                
                                <div className='flex gap-2.5 items-center w-full justify-between p-2'>
                                    <div className='flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background'>
                                        {task.users?.map((user) => (
                                            <Avatar key={user.id}>
                                                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))
                                        }
                                    </div>
                                    <div>{task.subtasks && task.subtasks.length > 0 ? <i className="fa-solid fa-diagram-predecessor"></i> : ''}</div>
                                </div>
                                
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
                            setImageModalOpen(true)
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
                <div className="float-right mb-2 ml-6 flex min-h-5 w-64 max-w-10/12 items-center rounded-md bg-neutral-800 p-2">
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

            {imageModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
                    onClick={() => setImageModalOpen(false)}
                >
                    <div
                        className="bg-neutral-800 rounded-md w-96 max-w-md shadow-lg p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Add Image</h3>
                        <form onSubmit={addImage}>
                            <div className="relative flex aspect-square w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 shadow-sm mb-2">
                                <UploadIcon className="text-gray-400 w-6 h-6" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="image"
                                    name="image"
                                    onChange={(e) => {
                                        setData("image", e.currentTarget.files?.[0]);
                                    }}
                                    className="absolute h-full w-full cursor-pointer opacity-0"
                                />
                            </div>
                            {data.image && (
                                <span className="mb-2 w-fit text-sm text-gray-600">{(data.image as File).name}</span>
                            )}

                            <span className="mx-auto text-muted-foreground text-sm">or</span>

                            <div className="mt-2">
                                <Label htmlFor="link" className="text-sm text-gray-300">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    placeholder="Paste an image's link"
                                    onChange={(e) => setData("image_link", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setImageModalOpen(false)}
                                    className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700"
                                >
                                    Save Image
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
