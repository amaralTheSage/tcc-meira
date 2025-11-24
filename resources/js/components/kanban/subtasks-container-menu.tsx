import { TaskSubtask } from "@/types/models";
import { router } from "@inertiajs/react";
import { toast } from "sonner";
import task from "../traceboard/task";
import { useState } from "react";
import SubtaskUtilMenu from "./subtask-util-menu";



export default function SubtaskContainerMenu({ subtask, project_id }: { subtask: TaskSubtask, project_id: string }) {
    const [utilMenuOpen, setUtilMenuOpen] = useState(false);
    
    function deleteSubtask(){
        router.delete(
            route('subtasks.destroy', { project: project_id, subtask_id: subtask.id }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('subtask deleted successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when deleting the Subtask.');
                }
            }
        );
    }

    return (
        <div className="relative flex items-center mb-0.5 pl-4 gap-2 border-solid border-x-0 border-neutral-500 border-2">
            <input className="appearance-none bg-transparent rounded-full border-2 border-solid border-red-700 w-5 h-5 checked:bg-red-600 cursor-pointer" type="checkbox" name="check_completed" id="check_completed" />
            <div className="min-h-5 max-w-11/12 duration-75 w-full rounded-md p-1.5 flex items-center">
                <div className="w-full flex items-center justify-between pl-2">
                    <span className="truncate">{subtask.title || "Untitled Task"}</span>
                    <i className="fa-solid fa-ellipsis-vertical fa-lg cursor-pointer hover:text-red-700" onClick={(e) => { e.stopPropagation(); setUtilMenuOpen(!utilMenuOpen); }}></i>
                </div>
            </div>
            {utilMenuOpen &&(
                <SubtaskUtilMenu onDelete={deleteSubtask} />
            )
            }
        </div>
    );
}
