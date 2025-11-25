import { TaskSubtask } from '@/types/models';

export default function SubtaskContainer({ subtask }: { subtask: TaskSubtask }) {
    return (
        <div className="relative z-0 mb-0.5 flex items-center pl-4">
            <div className="absolute top-3/5 left-2 h-0.5 w-2 -translate-y-1/2 transform bg-neutral-500"></div> {/* horizontal line */}
            <div className="absolute -top-1 left-2 h-7 w-0.5 bg-neutral-500"></div> {/* vertical line pointing right */}
            <div className="flex min-h-5 w-full max-w-11/12 cursor-pointer items-center rounded-md border-2 border-solid border-neutral-500 bg-neutral-700 p-1.5 duration-75 hover:border-solid hover:border-red-700">
                <div className="flex w-full items-center justify-between pl-2">
                    <span className="truncate">{subtask.title || 'Untitled Task'}</span>
                </div>
            </div>
        </div>
    );
}
