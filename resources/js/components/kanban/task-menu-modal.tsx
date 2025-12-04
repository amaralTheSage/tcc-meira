import type { TaskSubtask, ColumnTask, Column } from "@/types/models";
import ModalHeader from "./task-modal-head";
import { toast } from "sonner";
import { router, usePage, useForm } from "@inertiajs/react";
import { useInitials } from '@/hooks/use-initials';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

type ChangeEvent = React.ChangeEvent<HTMLInputElement>;

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import SubtaskContainerMenu from "./subtasks-container-menu";
import { useEcho } from "@laravel/echo-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
    project_id
}: {
    task?: ColumnTask,
    closeModal: React.Dispatch<React.SetStateAction<boolean>>,
    column?: Column,
    subtasks: TaskSubtask[],
    createSubtask: () => void,
    startCreatingSubtask: () => void,
    cancelCreatingSubtask: () => void,
    newSubtaskTitle: string,
    setNewSubtaskTitle: (title: string) => void,
    creatingSubtask: boolean,
    project_id: string
}) {

    const { props } = usePage();
    const project = props.project as { members?: any[] };

    const getInitials = useInitials()

    const [editMode, setEditMode] = useState(false);
    const [editingName, setEditingName] = useState(task?.title || "");
    const [assignedUsers, setAssignedUsers] = useState<string[]>(
        Array.isArray(task?.users)
            ? task.users.map((u: any) => String(u.id))
            : []
    );

    const [assignedSubtaskUsers, setAssignedSubtaskUsers] = useState<Record<string, string[]>>(
        subtasks?.reduce((acc, subtask) => {
            acc[subtask.id] = subtask.users?.map((user: any) => String(user.id)) || [];
            return acc;
        }, {} as Record<string, string[]>) || {}
    );

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const { data, setData } = useForm<{ image?: File; image_link?: string }>();


    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
        ],
        content: task?.description || '',
        editorProps: {
            attributes: {
                class: "prose prose-invert focus:outline-none min-h-[120px]",
            },
        },
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
                }
            }
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
                }
            }
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
        router.delete(
            route('tasks.users.detach', { project: project_id, task: task.id, user: userId }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedUsers(prev => prev.filter(id => id !== userId));
                    toast.success('User removed from task');
                },
                onError: () => toast.error('Failed to remove user'),
            }
        );
    } else {
        // Attach user
        router.post(
            route('tasks.users.attach', { project: project_id, task: task.id }),
            { user_id: userId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedUsers(prev => [...prev, userId]);
                    toast.success('User assigned to task');
                },
                onError: () => toast.error('Failed to assign user'),
            }
        );
    }
}


function handleSubtaskUserAssignment(userId: string, subtaskId: string) {

    const subtaskUsers = assignedSubtaskUsers[subtaskId] || [];
    const isAssigned = subtaskUsers.includes(userId);

    if (isAssigned) {
        // Detach user
        router.delete(
            route('subtasks.users.detach', { project: project_id, subtask: subtaskId, user: userId }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedSubtaskUsers(prev => ({
                        ...prev,
                        [subtaskId]: prev[subtaskId]?.filter(id => id !== userId) || []
                    }));
                    toast.success('User removed from subtask');
                },
                onError: () => toast.error('Failed to remove user'),
            }
        );
    } else {
        // Attach user
        router.post(
            route('subtasks.users.attach', { project: project_id, subtask: subtaskId }),
            { user_id: userId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAssignedSubtaskUsers(prev => ({
                        ...prev,
                        [subtaskId]: [...(prev[subtaskId] || []), userId]
                    }));
                    toast.success('User assigned to subtask');
                },
                onError: () => toast.error('Failed to assign user'),
            }
        );
    }
}

function handleSubtaskCompletion(subtaskId: string) {
    const subtask = subtasks.find(s => s.id === subtaskId);
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
            }
        }
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
                const imageUrl = data.image_link || (data.image ? URL.createObjectURL(data.image) : null);
            },
            onError: (errors) => {
                toast.error('An error occurred when adding an image to a task.');
                console.error(errors);
            },
        },
    );
}

    

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => closeModal(false)}>
            <div
                className="bg-neutral-800 rounded-md w-[75vw] max-w-[75vw] shadow-lg max-h-[95vh] overflow-y-auto p-4"
                onClick={e => e.stopPropagation()}
            >
                <ModalHeader closeModal={closeModal} column={column} />
                <div className="flex mb-4 p-4 gap-2 w-full justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h2
                            className="text-xl font-bold text-white"
                            onClick={() => {
                                setEditMode(true);
                                setEditingName(task?.title || "");
                            }}
                        >
                            {!editMode && (task?.title || "Untitled Task")}
                            {editMode && (
                                <input
                                    name="column-name"
                                    className="focus:border-red-800 max-w-96 border rounded outline-none px-2"
                                    autoFocus
                                    value={editingName}
                                    onChange={(e: ChangeEvent) => setEditingName(e.target.value)}
                                    onBlur={() => {
                                        updateTaskTitle(task, editingName);
                                        setEditMode(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            updateTaskTitle(task, editingName);
                                            setEditMode(false);
                                        }
                                    }}
                                />
                            )}
                        </h2>
                        <div className='flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background'>
                                {task?.users?.map((user) => (
                                    <Avatar key={user.id}>
                                        <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))
                                }
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col bg-neutral-900 rounded-md">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-48 justify-start cursor-pointer">
                                        {assignedUsers.length > 0
                                            ? `${assignedUsers.length} member${assignedUsers.length > 1 ? 's' : ''} assigned`
                                            : "Select members..."}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="space-y-2">
                                        {project?.members?.map((member: any) => {
                                            const isAssigned = assignedUsers.includes(String(member.id));
                                            return (
                                                <div key={member.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`member-${member.id}`}
                                                        checked={isAssigned}
                                                        onCheckedChange={() => handleUserAssignment(String(member.id))}
                                                    />
                                                    <img
                                                        className="rounded-full h-8 w-8"
                                                        src={member.avatar}
                                                        alt=""
                                                    />
                                                    <label
                                                        htmlFor={`member-${member.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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

                        <span
                            className={`text-xs px-2 py-1 rounded ${
                                task?.status === "pending"
                                    ? "text-red-500 bg-red-500/10"
                                    : task?.status === "in_progress"
                                    ? "text-blue-500 bg-blue-500/10"
                                    : "text-green-500 bg-green-500/10"
                            }`}
                        >
                            {task?.status === "pending"
                                ? "Pending"
                                : task?.status === "in_progress"
                                ? "In Progress"
                                : "Completed"}
                        </span>
                    </div>
                        
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-2/3 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        {task?.image && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Imagem</label>
                                <img className="max-w-2xl" src={task?.image} alt="" />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <div className="mb-2">
                                <button
                                    type="button"
                                    onClick={() => setImageModalOpen(true)}
                                    className="px-2 py-1 border rounded text-gray-300 hover:bg-gray-700 cursor-pointer"
                                    aria-label="Insert Image"
                                    title="Insert Image"
                                >
                                    🖼️
                                </button>
                            </div>
                            <div className="border-2 border-solid border-neutral-500 rounded max-w-2xl p-2 min-h-[120px] text-white bg-neutral-900 max-h-[40vh] overflow-y-auto">
                                <EditorContent editor={editor} />
                            </div>
                            <button
                                onClick={() => updateTaskDescription(task, editor?.getHTML() || "")}
                                className="mt-2 px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700 text-sm"
                            >
                                Save Description
                            </button>
                        </div>
                    </div>

                    <aside className="w-1/3 overflow-y-auto max-h-[60vh] p-4 bg-neutral-900 rounded-md flex flex-col gap-4">
                        <h3 className="text-neutral-500">Subtasks</h3>
                        {subtasks && (   
                            <div className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
                                <table className="w-full text-sm text-left rtl:text-right text-body overflow-x-hidden custom-scrollbar">
                                    <thead className="text-sm text-body bg-neutral-900 border-b border-default-medium">
                                        <tr className="text-neutral-400">
                                            <th scope="col" className="px-6 py-3 font-medium">

                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium">
                                                Titulo
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 font-medium">
                                                Responsaveis
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(subtasks) &&
                                            subtasks.map((subtask) => (
                                                <tr className="bg-neutral-800 border-b cursor-pointer border-default hover:bg-neutral-700 text-neutral-500">
                                                    <th scope="row" className="px-6 py-4">
                                                        <Checkbox
                                                            checked={subtask.completed || false}
                                                            onCheckedChange={() => handleSubtaskCompletion(subtask.id)}
                                                            className="border-2 border-solid border-neutral-700 cursor-pointer"
                                                        />
                                                    </th>
                                                    <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                                                        {subtask.title}     
                                                    </th>
                                                    <td className="px-6 py-4">
                                                        {subtask.completed ? 'Completed' : 'Pending'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col bg-neutral-900 rounded-md">
                                                            <Popover>
                                                                <PopoverTrigger asChild >
                                                                    <Button variant="outline" className="w-40 justify-start cursor-pointer">
                                                                        {(assignedSubtaskUsers[subtask.id]?.length || 0) > 0
                                                                            ?  <div className='flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background'>
                                                                                    {subtask?.users?.map((user) => (
                                                                                        <Avatar key={user.id}>
                                                                                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                                                                                Membros
                                                                                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                                                                {getInitials(user.name)}
                                                                                            </AvatarFallback>
                                                                                        </Avatar>
                                                                                        ))
                                                                                    }
                                                                                </div>

                                                                            : <><i className="fa-solid fa-circle-user fa-lg"></i><p>não atribuida</p></> }
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="space-y-2">
                                                                        {project?.members?.map((member: any) => {
                                                                            const isAssigned = assignedSubtaskUsers[subtask.id]?.includes(String(member.id)) || false;
                                                                            return (
                                                                                <div key={member.id} className="flex items-center space-x-2">
                                                                                    <Checkbox
                                                                                        id={`member-${member.id}`}
                                                                                        checked={isAssigned}
                                                                                        onCheckedChange={() => handleSubtaskUserAssignment(String(member.id), subtask.id)}
                                                                                    />
                                                                                    <img
                                                                                        className="rounded-full h-8 w-8"
                                                                                        src={member.avatar}
                                                                                        alt=""
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={`member-${member.id}`}
                                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
                                                    </td>
                                                </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        )}
                        {creatingSubtask && (
                            <div className="bg-neutral-800 border-b border-default hover:bg-neutral-700">
                                <div className="px-6 py-4 flex items-center gap-4">
                                    <div className="w-4"></div>
                                    <input
                                        type="text"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                createSubtask();
                                            } else if (e.key === "Escape") {
                                                cancelCreatingSubtask();
                                            }
                                        }}
                                        placeholder="Subtask title..."
                                        className="flex-1 bg-transparent outline-none text-white placeholder-neutral-400 text-sm"
                                        autoFocus
                                    />
                                    <div className="text-neutral-500 text-sm">Pending</div>
                                    <div className="w-40 text-neutral-500 text-sm">não atribuida</div>
                                </div>
                            </div>
                        )}
                        <button
                            className="text-xs hover:text-red-700 cursor-pointer mb-2"
                            onClick={() => startCreatingSubtask()}
                        >
                            + Add subtask
                        </button>

                        
                    </aside>
                </div>
            </div>

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
                                <Button
                                    type="button"
                                    onClick={() => setImageModalOpen(false)}
                                    variant="outline"
                                    className="px-3 py-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700"
                                >
                                    Save Image
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
