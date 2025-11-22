import { TaskSubtask } from "@/types/models";

export default function SubtaskContainer({ subtask }: { subtask: TaskSubtask }) {
    return (
        <div className="ml-6 min-h-5 max-w-10/12 cursor-pointer bg-neutral-700 hover:border-solid border-solid border-neutral-500 border-2 duration-75 hover:border-red-700 w-full rounded-md mb-0.5 p-1.5">
            <div className="w-full flex items-center justify-between">
                <span className="truncate px-2.5">{subtask.title || "Untitled Task"}</span>
            </div>
        </div>
    );
}
