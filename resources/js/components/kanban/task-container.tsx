import { SprintBadge } from '@/components/sprint-badge';
import TagsSubmenu from '@/components/traceboard/tags-submenu';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { Column, ColumnTask, Project, Sprint, Tag } from '@/types/models';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@headlessui/react';
import { router, useForm } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { UploadIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import SubtaskContainer from './subtasks-container';
import TaskMenuModal from './task-menu-modal';

// Kanban Task container — props are typed inline below

export default function TaskContainer({
    task,
    project_id,
    column,
    project,
}: {
    task: ColumnTask;
    project_id: string;
    column?: Column;
    project: Project;
}) {
    const [modalMenuOpen, setModalMenuOpen] = useState(false);

    const getInitials = useInitials();

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const { data, setData } = useForm<{ image?: File; image_link?: string }>();

    const [creatingSubTask, setCreatingSubTask] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const [imageUrl, setImageUrl] = useState<string | undefined>(task.image);
    const [tags, setTags] = useState<Tag[]>([]);

    useEcho<{ taskId: string; image: string | null }>('tasks', 'TaskImageUpdated', (payload) => {
        if (payload.taskId === task.id) {
            setImageUrl(payload.image ?? undefined);
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

        const subtaskPayload = {
            title: newSubtaskTitle.trim(),
            position: task.subtasks?.length ?? 0, // Use current subtasks count as position safely
            task_id: task.id,
        };
        router.post(route('subtasks.store', { project: project_id }), subtaskPayload, {
            preserveScroll: true,
            preserveState: 'errors',
            onSuccess: () => {
                toast.success('Subtask created successfuly');
            },
            onError: () => {
                toast.error('An error occurred when creating the Subtask.');
            },
        });
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
                },
                onError: () => {
                    toast.error('An error occurred when adding an image to a task.');
                },
            },
        );
    }

    const combinedSubtasks = task.subtasks || [];
    const sprint = project.sprints?.find((projectSprint) => String(projectSprint.id) === String(task.sprint_id));

    const subtasks_container = combinedSubtasks.map((subtask, index) => (
        <SubtaskContainer key={subtask.id} subtask={subtask} index={index} isDragging={isDragging} />
    ));

    return (
        <div className="relative flex flex-col">
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        data-testid={`kanban-task-${task.id}`}
                        ref={setNodeRef}
                        style={style}
                        {...listeners}
                        {...attributes}
                        className={` ${isDragging ? 'border-2 border-solid border-red-700 opacity-65' : ''} z-10 mb-0.5 flex min-h-12 w-[98%] cursor-pointer flex-col items-center justify-between gap-2 rounded-md bg-black p-1.5 duration-75 hover:border-2 hover:border-solid hover:border-red-700`}
                        onClick={() => setModalMenuOpen(true)}
                    >
                        <div className="w-full">
                            {imageUrl && <img src={imageUrl} alt="Task" className="wrap mb-2 h-40 w-full rounded object-cover" />}

                            <div className="mb-2 flex w-full items-start justify-between gap-2">
                                {sprint && <SprintAssignmentBadge projectId={project_id} sprint={sprint} />}
                                <div className="ml-auto flex min-w-0 flex-wrap justify-end gap-1">
                                    {task.tags?.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag.id}
                                            style={{ backgroundColor: tag.color }}
                                            className="rounded-xl px-4 text-sm text-primary-foreground"
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                    {task.tags && task.tags.length > 2 && (
                                        <span
                                            style={{ backgroundColor: task.tags[2].color }}
                                            className="rounded-xl px-4 text-sm text-primary-foreground"
                                        >
                                            +{task.tags.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-2 flex w-full items-center">
                            {task.status == 'completed' && <i className="fa-solid fa-circle-check text-green-500"></i>}
                            <span className="truncate px-2.5 text-wrap">{task.title || 'Untitled Task'}</span>
                        </div>

                        <div className="flex w-full justify-between">
                            <div className="flex w-full items-center justify-between">
                                <div className="flex w-full items-center justify-between gap-2.5 p-2">
                                    <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                                        {task.users?.map((user) => (
                                            <Avatar key={user.id}>
                                                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
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
                        <ContextMenuItem
                            inset
                            onSelect={(e) => {
                                e.preventDefault();
                                setImageModalOpen(true);
                            }}
                        >
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setImageModalOpen(false)}>
                    <div className="w-96 max-w-md rounded-md bg-neutral-800 p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-4 text-lg font-bold text-white">Add Image</h3>
                        <form onSubmit={addImage}>
                            <div className="relative mb-2 flex aspect-square w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 shadow-sm">
                                <UploadIcon className="h-6 w-6 text-gray-400" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="image"
                                    name="image"
                                    onChange={(e) => {
                                        setData('image', e.currentTarget.files?.[0]);
                                    }}
                                    className="absolute h-full w-full cursor-pointer opacity-0"
                                />
                            </div>
                            {data.image && <span className="mb-2 w-fit text-sm text-gray-600">{(data.image as File).name}</span>}

                            <span className="mx-auto text-sm text-muted-foreground">or</span>

                            <div className="mt-2">
                                <Label htmlFor="link" className="text-sm text-gray-300">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    placeholder="Paste an image's link"
                                    onChange={(e) => setData('image_link', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="mt-4 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setImageModalOpen(false)}
                                    className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="rounded bg-red-800 px-3 py-1 text-white hover:bg-red-700">
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

function SprintAssignmentBadge({ projectId, sprint }: { projectId: string; sprint: Sprint }): ReactElement {
    return (
        <SprintBadge
            ariaLabel={`Open sprint ${sprint.title}`}
            className="max-w-full shrink"
            sprint={sprint}
            onClick={(event) => {
                event.stopPropagation();
                router.get(route('sprint.index', { project: projectId }));
            }}
        />
    );
}
