import { Column, ColumnTask, TaskSubtask } from "@/types/models";
import ModalHeader from "./task-modal-head";
import { toast } from "sonner";
import { router, usePage, useForm } from "@inertiajs/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadIcon } from "lucide-react";
import SubtaskContainer from "./subtasks-container";

export default function TaskMenuModal({task, closeModal, column, subtasks} : {task?: ColumnTask, closeModal: React.Dispatch<React.SetStateAction<boolean>>, column?: Column, subtasks: TaskSubtask[]}) {

    const { props } = usePage();
    const project = props.project as { members?: any[] };

    const [editMode, setEditMode] = useState(false)
    const [editingName, setEditingName] = useState(task?.title || "")
    const [editingDescription, setEditingDescription] = useState(task?.description || "")
    const [assignedUsers, setAssignedUsers] = useState<string[]>(task?.users?.map((u: any) => u.id) || [])
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const { data, setData, errors } = useForm<{ image?: File; image_link?: string }>({})

    function updateTaskTitle(task: ColumnTask | undefined, title: string) {
        router.patch(
            route('tasks.update', { project: task?.project_id, task: task?.id }),
                { title },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                        toast.success('Task updated successfully');
                        // Update local state if needed, but let the page reload handle it
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
                onSuccess: (page) => {
                    toast.success('Task description updated successfully');
                    // Update local state if needed, but let the page reload handle it
                },
                onError: () => {
                    toast.error('An error occurred when updating the task description.');
                }
            }
        );
    }

    function handleUserAssignment(userId: string, isChecked: boolean) {
        if (isChecked) {
            // Attach user
            router.post(
                route('tasks.users.attach', { task: task?.id }),
                { user_id: userId },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAssignedUsers(prev => [...prev, userId]);
                        toast.success('User assigned to task');
                    },
                    onError: () => {
                        toast.error('Failed to assign user');
                    }
                }
            );
        } else {
            // Detach user
            router.delete(
                route('tasks.users.detach', { task: task?.id, user: userId }),
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setAssignedUsers(prev => prev.filter(id => id !== userId));
                        toast.success('User removed from task');
                    },
                    onError: () => {
                        toast.error('Failed to remove user');
                    }
                }
            );
        }
    }

    function addImage(e) {
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
                onSuccess: (page) => {
                    toast.success('Image added successfully');
                    setImageModalOpen(false);
                    setData({});
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
            <div className="bg-neutral-800 rounded-md w-96 max-w-md shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <ModalHeader closeModal={closeModal} column={column}/>
                <div className="flex mb-4 p-4 gap-2 w-full justify-between items-center">
                    <h2 className="text-xl font-bold text-white" onClick={ () => { setEditMode(true); setEditingName(task?.title || "") } }>
                        {!editMode && (task?.title || "Untitled Task")}
                        {editMode && <input value={editingName}
                                        name="column-name"
                                        className="focus:border-red-800 max-w-44 border rounded outline-none px-2"
                                        autoFocus
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={ () => { updateTaskTitle(task, editingName); setEditMode(false) } }
                                        onKeyDown={ (e) => {
                                        if(e.key === "Enter"){
                                            updateTaskTitle(task, editingName); setEditMode(false)
                                        }
                        }}/>}

                    </h2>
                    <span className={`text-xs ${task?.status == 'pending' ? 'text-red-500'
                            : task?.status == 'in_progress' ? 'text-blue-500'
                            : 'text-green-500'}`}>
                            {task?.status == 'pending' ? 'Pending'
                            : task?.status == 'in_progress' ? 'In Progress'
                            : 'Completed'}
                    </span>
                </div>

                <div className="mb-4 p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Images</label>
                    {task?.image && (
                        <img src={task.image} alt="Task image" className="mb-2 max-w-full h-auto rounded" />
                    )}
                    <Button onClick={() => setImageModalOpen(true)} className="px-3 py-1 bg-red-800 mb-4 text-white rounded hover:bg-red-700 text-sm">
                        Add Image
                    </Button>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <Textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="Add a description..."
                        className="w-full border-2 border-solid border-neutral-500"
                    />
                    <button
                        onClick={() => updateTaskDescription(task, editingDescription)}
                        className="mt-2 px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700 text-sm"
                    >
                        Save Description
                    </button>
                </div>

                <div>
                    {subtasks.map((subtask) => (
                        <SubtaskContainer subtask={subtask} />
                    ))}
                </div>

                <div className="mb-4 p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assign Members</label>
                    <div className="space-y-2">
                        {project?.members?.length ? project.members.map((member: any) => (
                            <label key={member.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={assignedUsers.includes(member.id)}
                                    onChange={(e) => handleUserAssignment(member.id, e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-white">{member.name}</span>
                            </label>
                        )) : <p className="text-gray-400">No members available</p>}
                    </div>
                </div>
            </div>
            {imageModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setImageModalOpen(false)}>
                    <div className="bg-neutral-800 rounded-md w-96 max-w-md shadow-lg p-4" onClick={(e) => e.stopPropagation()}>
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
                                        setData('image', e.target.files?.[0]);
                                    }}
                                    className="absolute h-full w-full cursor-pointer opacity-0"
                                />
                            </div>
                            {data.image && <span className="mb-2 w-fit text-sm text-gray-600">{data.image.name}</span>}

                            <span className="mx-auto text-muted-foreground text-sm">or</span>

                            <div className="mt-2">
                                <Label htmlFor="link" className="text-sm text-gray-300">Link</Label>
                                <Input
                                    id="link"
                                    placeholder="Paste an image's link"
                                    onChange={(e) => setData('image_link', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" onClick={() => setImageModalOpen(false)} variant="outline" className="px-3 py-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="px-3 py-1 bg-red-800 text-white rounded hover:bg-red-700">
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
