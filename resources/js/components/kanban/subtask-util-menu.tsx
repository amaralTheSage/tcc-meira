interface TaskUtilMenuProps {
    onDelete: () => void;
}

export default function SubtaskUtilMenu({ onDelete }: TaskUtilMenuProps) {
    return (
        <div className="bg-neutral-800 p-2 max-h-10 rounded-md transition-all duration-1000 shadow-md flex flex-col gap-2 absolute top-8 right-0 z-10">
            <button onClick={onDelete} className="text-left hover:text-red-700 text-sm cursor-pointer max-h-10 rounded-md w-full">Delete Task</button>
        </div>
    );
}
