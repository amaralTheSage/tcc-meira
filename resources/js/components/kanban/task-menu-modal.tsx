import { Column, ColumnTask } from "@/types/models";
import ModalHeader from "./task-modal-head";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import { useState } from "react";

export default function TaskMenuModal({task, closeModal, column} : {task?: ColumnTask, closeModal: React.Dispatch<React.SetStateAction<boolean>>, column?: Column}) {

    const [editMode, setEditMode] = useState(false)
    const [editingName, setEditingName] = useState(task?.title || "")
    const [editingDescription, setEditingDescription] = useState(task?.description || "")

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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                        className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Add a description..."
                        rows={3}
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        onBlur={() => updateTaskDescription(task, editingDescription)}
                    />
                </div>
            </div>
        </div>
    );
}
