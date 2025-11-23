import { TaskSubtask } from "@/types/models";

export default function SubtaskContainer({ subtask }: { subtask: TaskSubtask }) {
    return (
        <div className="relative flex items-center mb-0.5 pl-4 z-0">
            <div className="absolute left-2 top-3/5 h-0.5 w-2 bg-neutral-500 transform -translate-y-1/2"></div> {/* horizontal line */}
            <div className="absolute left-2 -top-5 h-11 w-0.5 bg-neutral-500"></div> {/* vertical line pointing right */}
            <div className="min-h-5 max-w-11/12 cursor-pointer bg-neutral-700 hover:border-solid border-solid border-neutral-500 border-2 duration-75 hover:border-red-700 w-full rounded-md p-1.5 flex items-center">
                <div className="w-full flex items-center justify-between pl-2">
                    <span className="truncate">{subtask.title || "Untitled Task"}</span>
                </div>
            </div>
        </div>
    );
}
