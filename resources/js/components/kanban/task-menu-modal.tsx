import type { TaskSubtask, ColumnTask, Column } from "@/types/models";
import ModalHeader from "./task-modal-head";
import { toast } from "sonner";
import { router, usePage, useForm } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadIcon } from "lucide-react";

type ChangeEvent = React.ChangeEvent<HTMLInputElement>;

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import SubtaskContainerMenu from "./subtasks-container-menu";
import { useEcho } from "@laravel/echo-react";

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

    const [editMode, setEditMode] = useState(false);
    const [editingName, setEditingName] = useState(task?.title || "");
    const [assignedUsers, setAssignedUsers] = useState<string[]>(
        Array.isArray(task?.users)
            ? task.users.map((u: any) => String(u.id))
            : []
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
                className="bg-neutral-800 rounded-md w-[80rem] max-w-[calc(100vw-2rem)] shadow-lg max-h-[90vh] overflow-y-auto p-4"
                onClick={e => e.stopPropagation()}
            >
                <ModalHeader closeModal={closeModal} column={column} />
                <div className="flex mb-4 p-4 gap-2 w-full justify-between items-center">
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
                    <span
                        className={`text-xs ${
                            task?.status === "pending"
                                ? "text-red-500"
                                : task?.status === "in_progress"
                                ? "text-blue-500"
                                : "text-green-500"
                        }`}
                    >
                        {task?.status === "pending"
                            ? "Pending"
                            : task?.status === "in_progress"
                            ? "In Progress"
                            : "Completed"}
                    </span>
                </div>

                <div className="flex gap-6">
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
                        {subtasks && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Subtasks</label>
                                {Array.isArray(subtasks) &&
                                    subtasks.map((subtask) => (
                                        <SubtaskContainerMenu subtask={subtask} key={subtask.id} project_id={project_id}/>
                                    ))}
                            </div>
                        )}
                        {creatingSubtask && (
                            <div className="min-h-5 max-w-10/12 ml-6 float-right bg-neutral-600 w-64 rounded-md mb-2 p-2 flex items-center">
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
                                    className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
                                    autoFocus
                                />
                            </div>
                        )}
                        <button
                            className="text-xs hover:text-red-700 cursor-pointer mb-2"
                            onClick={() => startCreatingSubtask()}
                        >
                            + Add subtask
                        </button>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Assign Members</label>
                            <div className="inline-grid grid-cols-3 gap-2 max-h-[30vh] overflow-y-auto">
                                
                                {project?.members?.map((member: any) => {
                                    const isAssigned = assignedUsers.includes(String(member.id));
                                    return (
                                        <img
                                            key={member.id}
                                            className={"rounded-full h-10 w-10 cursor-pointer hover:border-solid border-2 " + (isAssigned ? "border-red-600" : "border-transparent")}
                                            onClick={() => handleUserAssignment(String(member.id))}
                                            src={member.avatar}
                                            alt=""
                                            title={member.name + (isAssigned ? " (Assigned)" : "")}
                                        />
                                    );
                                })}

                            </div>
                        </div>
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
