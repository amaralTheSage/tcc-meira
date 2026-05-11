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
                        className={` ${isDragging ? 'border-red-700 opacity-65' : ''} z-10 flex min-h-12 w-full cursor-pointer flex-col items-center justify-between gap-2 rounded-md border border-border/70 bg-background/90 p-2 shadow-sm shadow-black/20 transition-colors hover:border-red-800/70 hover:bg-muted/50`}
                        onClick={() => setModalMenuOpen(true)}
                    >
                        <div className="w-full">
                            {imageUrl && <img src={imageUrl} alt="Task" className="wrap mb-2 h-40 w-full rounded-md object-cover" />}

                            <div className="mb-2 flex w-full items-start justify-between gap-2">
                                {sprint && <SprintAssignmentBadge projectId={project_id} sprint={sprint} />}
                                <div className="ml-auto flex min-w-0 flex-wrap justify-end gap-1">
                                    {task.tags?.slice(0, 2).map((tag) => (
                                        <span
                                            key={tag.id}
                                            style={{ backgroundColor: tag.color }}
                                            className="rounded-full px-2 py-0.5 text-xs text-primary-foreground"
                                        >
                                            {tag.name}
                                        </span>
                                    ))}
                                    {task.tags && task.tags.length > 2 && (
                                        <span
                                            style={{ backgroundColor: task.tags[2].color }}
                                            className="rounded-full px-2 py-0.5 text-xs text-primary-foreground"
                                        >
                                            +{task.tags.length - 2}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mb-2 flex w-full items-center">
                            {task.status == 'completed' && <i className="fa-solid fa-circle-check text-green-500"></i>}
                            <span className="px-1 text-sm leading-5 break-words text-foreground">{task.title || 'Untitled Task'}</span>
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
                                    <div className="text-muted-foreground">
                                        {task.subtasks && task.subtasks.length > 0 ? <i className="fa-solid fa-diagram-predecessor"></i> : ''}
                                    </div>
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
                <div className="mb-2 ml-6 flex min-h-10 w-64 max-w-10/12 items-center rounded-md border border-border/70 bg-background/90 p-2">
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
                        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => setImageModalOpen(false)}
                >
                    <div
                        className="w-96 max-w-md rounded-md border border-border/70 bg-background p-4 shadow-xl shadow-black/40"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="mb-4 text-lg font-bold text-white">Add Image</h3>
                        <form onSubmit={addImage}>
                            <div className="relative mb-2 flex aspect-square w-20 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border/80 shadow-sm">
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
                            {data.image && <span className="mb-2 w-fit text-sm text-muted-foreground">{(data.image as File).name}</span>}

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
                                    className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="rounded-md bg-red-800 px-3 py-1 text-white hover:bg-red-700">
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
