import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';
import type { Column, ColumnTask, Sprint, TaskSubtask } from '@/types/models';
import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import TaskImageDialog from './task-menu-modal/task-image-dialog';
import TaskSubtasksPanel from './task-menu-modal/task-subtasks-panel';
import ModalHeader from './task-modal-head';

type ChangeEvent = React.ChangeEvent<HTMLInputElement>;

import { useEcho } from '@laravel/echo-react';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function TaskMenuModal({
    task,
    closeModal,
    column,
    subtasks,
    createSubtask,
    startCreatingSubtask,
    cancelCreatingSubtask,
    newSubtaskTitle,
    setNewSubtaskTitle,
    creatingSubtask,
    project_id,
}: {
    task?: ColumnTask;
    closeModal: React.Dispatch<React.SetStateAction<boolean>>;
    column?: Column;
    subtasks: TaskSubtask[];
    createSubtask: () => void;
    startCreatingSubtask: () => void;
    cancelCreatingSubtask: () => void;
    newSubtaskTitle: string;
    setNewSubtaskTitle: (title: string) => void;
    creatingSubtask: boolean;
    project_id: string;
}) {
    const { props } = usePage();
    const project = props.project as { members?: User[]; sprints?: Sprint[] };

    const getInitials = useInitials();

    const [editMode, setEditMode] = useState(false);
    const [editingName, setEditingName] = useState(task?.title || '');
    const [assignedUsers, setAssignedUsers] = useState<string[]>(Array.isArray(task?.users) ? task.users.map((user) => String(user.id)) : []);

    const [assignedSubtaskUsers, setAssignedSubtaskUsers] = useState<Record<string, string[]>>(
        subtasks?.reduce(
            (acc, subtask) => {
                acc[subtask.id] = subtask.users?.map((user) => String(user.id)) || [];
                return acc;
            },
            {} as Record<string, string[]>,
        ) || {},
    );

    // Update state when subtasks prop changes
    useEffect(() => {
        setAssignedSubtaskUsers(
            subtasks?.reduce(
                (acc, subtask) => {
                    acc[subtask.id] = subtask.users?.map((user) => String(user.id)) || [];
                    return acc;
                },
                {} as Record<string, string[]>,
            ) || {},
        );
    }, [subtasks]);

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const { data, setData } = useForm<{ image?: File; image_link?: string }>();

    const editor = useEditor({
        extensions: [StarterKit, Image],
        content: task?.description || '',
        editorProps: {
            attributes: {
                class: 'prose prose-invert focus:outline-none min-h-[120px]',
            },
        },
    });

    useEcho<{ userId: string; subtaskId: string }>('subtasks_users', 'SubtaskAssignedUser', (_payload) => {
        // Reload the page data to reflect the user assignment change
        router.reload({ only: ['task', 'subtasks'] });
    });

    useEcho<{ taskId: string; image: string }>('tasks', 'TaskImageUpdated', (payload) => {
        if (payload.taskId === task?.id) {
            // Reload the task data to reflect the image change
            router.reload({ only: ['task'] });
        }
    });

    function updateTaskTitle(task: ColumnTask | undefined, title: string) {
        router.patch(
            route('tasks.update', { project: task?.project_id, task: task?.id }),
            { title },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Task updated successfully');
                },
                onError: () => {
                    toast.error('An error occurred when updating the task.');
                },
            },
        );
    }

    function updateTaskDescription(task: ColumnTask | undefined, description: string) {
        router.patch(
            route('tasks.update', { project: task?.project_id, task: task?.id }),
            { description },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Task description updated successfully');
                },
                onError: () => {
                    toast.error('An error occurred when updating the task description.');
                },
            },
        );
    }

    function handleUserAssignment(userId: string) {
        if (!task?.id) {
            toast.error('Task ID is missing, cannot assign user.');
            return;
        }

        const isAssigned = assignedUsers.includes(userId);

        if (isAssigned) {
            // Detach user
            router.delete(route('tasks.users.detach', { project: project_id, task: task.id, user: userId }), {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedUsers((prev) => prev.filter((id) => id !== userId));
                    toast.success('User removed from task');
                },
                onError: () => toast.error('Failed to remove user'),
            });
        } else {
            // Attach user
            router.post(
                route('tasks.users.attach', { project: project_id, task: task.id }),
                { user_id: userId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAssignedUsers((prev) => [...prev, userId]);
                        toast.success('User assigned to task');
                    },
                    onError: () => toast.error('Failed to assign user'),
                },
            );
        }
    }

    function handleSubtaskUserAssignment(userId: string, subtaskId: string) {
        const subtaskUsers = assignedSubtaskUsers[subtaskId] || [];
        const isAssigned = subtaskUsers.includes(userId);

        if (isAssigned) {
            // Detach user
            router.delete(route('subtasks.users.detach', { project: project_id, subtask: subtaskId, user: userId }), {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedSubtaskUsers((prev) => ({
                        ...prev,
                        [subtaskId]: prev[subtaskId]?.filter((id) => id !== userId) || [],
                    }));
                    toast.success('User removed from subtask');
                },
                onError: () => toast.error('Failed to remove user'),
            });
        } else {
            // Attach user
            router.post(
                route('subtasks.users.attach', { project: project_id, subtask: subtaskId }),
                { user_id: userId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAssignedSubtaskUsers((prev) => ({
                            ...prev,
                            [subtaskId]: [...(prev[subtaskId] || []), userId],
                        }));
                        toast.success('User assigned to subtask');
                    },
                    onError: () => toast.error('Failed to assign user'),
                },
            );
        }
    }

    function handleSubtaskCompletion(subtaskId: string) {
        const subtask = subtasks.find((s) => s.id === subtaskId);
        if (!subtask) return;

        const newCompletedStatus = !subtask.completed;

        router.patch(
            route('subtasks.update', { project: project_id, subtask_id: subtaskId }),
            { completed: newCompletedStatus },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Subtask ${newCompletedStatus ? 'completed' : 'marked as incomplete'}`);
                },
                onError: () => {
                    toast.error('Failed to update subtask status');
                },
            },
        );
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

    function handleSprintAssignment(sprintId: string) {
        router.patch(
            route('tasks.update', { project: project_id, task: task?.id }),
            { sprint_id: sprintId || null },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sprint assigned successfully'),
                onError: () => toast.error('Failed to assign sprint'),
            },
        );
    }

    return (
        <div
            data-testid={`kanban-task-modal-${task?.id}`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => closeModal(false)}
        >
            <div
                className="max-h-[95vh] w-[75vw] max-w-[75vw] overflow-y-auto rounded-md bg-neutral-800 p-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <ModalHeader closeModal={closeModal} column={column} />
                <div className="mb-4 flex w-full items-center justify-between gap-2 p-4">
                    <div className="flex items-center gap-2">
                        <h2
                            data-testid={`kanban-task-title-${task?.id}`}
                            className="text-xl font-bold text-white"
                            onClick={() => {
                                setEditMode(true);
                                setEditingName(task?.title || '');
                            }}
                        >
                            {!editMode && (task?.title || 'Untitled Task')}
                            {editMode && (
                                <input
                                    name="column-name"
                                    className="max-w-96 rounded border px-2 outline-none focus:border-red-800"
                                    autoFocus
                                    value={editingName}
                                    onChange={(e: ChangeEvent) => setEditingName(e.target.value)}
                                    onBlur={() => {
                                        updateTaskTitle(task, editingName);
                                        setEditMode(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            updateTaskTitle(task, editingName);
                                            setEditMode(false);
                                        }
                                    }}
                                />
                            )}
                        </h2>
                        <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                            {task?.users?.map((user) => (
                                <Avatar key={user.id}>
                                    <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col rounded-md bg-neutral-900">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-48 cursor-pointer justify-start">
                                        {assignedUsers.length > 0
                                            ? `${assignedUsers.length} member${assignedUsers.length > 1 ? 's' : ''} assigned`
                                            : 'Select members...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        {project.members?.map((member) => {
                                            const isAssigned = assignedUsers.includes(String(member.id));
                                            return (
                                                <div key={member.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`member-${member.id}`}
                                                        checked={isAssigned}
                                                        onCheckedChange={() => handleUserAssignment(String(member.id))}
                                                    />
                                                    <img className="h-8 w-8 rounded-full" src={member.avatar} alt="" />
                                                    <label
                                                        htmlFor={`member-${member.id}`}
                                                        className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {member.name}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex flex-col rounded-md bg-neutral-900">
                            <select
                                className="w-40 cursor-pointer rounded-md border border-neutral-800 bg-transparent p-2 text-sm text-white focus:ring-1 focus:ring-neutral-700 focus:outline-none"
                                value={task?.sprint_id || ''}
                                onChange={(e) => handleSprintAssignment(e.target.value)}
                            >
                                <option value="">No Sprint</option>
                                {project.sprints?.map((sprint) => (
                                    <option key={sprint.id} value={sprint.id}>
                                        {sprint.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <span
                            className={`rounded px-2 py-1 text-xs ${
                                task?.status === 'pending'
                                    ? 'bg-red-500/10 text-red-500'
                                    : task?.status === 'in_progress'
                                      ? 'bg-blue-500/10 text-blue-500'
                                      : 'bg-green-500/10 text-green-500'
                            }`}
                        >
                            {task?.status === 'pending' ? 'Pending' : task?.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-6 md:flex-row">
                    <div className="custom-scrollbar max-h-[60vh] w-2/3 overflow-y-auto">
                        {task?.image && (
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium text-gray-300">Imagem</label>
                                <img className="max-w-2xl" src={task?.image} alt="" />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-300">Description</label>
                            <div className="mb-2">
                                <button
                                    type="button"
                                    onClick={() => setImageModalOpen(true)}
                                    className="cursor-pointer rounded border px-2 py-1 text-gray-300 hover:bg-gray-700"
                                    aria-label="Insert Image"
                                    title="Insert Image"
                                >
                                    🖼️
                                </button>
                            </div>
                            <div className="max-h-[40vh] min-h-[120px] max-w-2xl overflow-y-auto rounded border-2 border-solid border-neutral-500 bg-neutral-900 p-2 text-white">
                                <EditorContent editor={editor} />
                            </div>
                            <button
                                onClick={() => updateTaskDescription(task, editor?.getHTML() || '')}
                                className="mt-2 rounded bg-red-800 px-3 py-1 text-sm text-white hover:bg-red-700"
                            >
                                Save Description
                            </button>
                        </div>
                    </div>

                    <TaskSubtasksPanel
                        assignedSubtaskUsers={assignedSubtaskUsers}
                        cancelCreatingSubtask={cancelCreatingSubtask}
                        createSubtask={createSubtask}
                        creatingSubtask={creatingSubtask}
                        getInitials={getInitials}
                        members={project.members}
                        newSubtaskTitle={newSubtaskTitle}
                        onSubtaskCompletion={handleSubtaskCompletion}
                        onSubtaskUserAssignment={handleSubtaskUserAssignment}
                        setNewSubtaskTitle={setNewSubtaskTitle}
                        startCreatingSubtask={startCreatingSubtask}
                        subtasks={subtasks}
                    />
                </div>
            </div>

            {imageModalOpen && (
                <TaskImageDialog
                    image={data.image}
                    onClose={() => setImageModalOpen(false)}
                    onImageChange={(file) => setData('image', file)}
                    onImageLinkChange={(link) => setData('image_link', link)}
                    onSubmit={addImage}
                />
            )}
        </div>
    );
}
