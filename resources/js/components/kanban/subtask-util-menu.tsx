interface TaskUtilMenuProps {
    onDelete: () => void;
}

export default function SubtaskUtilMenu({ onDelete }: TaskUtilMenuProps) {
    return (
        <div className="absolute top-8 right-0 z-10 flex max-h-10 flex-col gap-2 rounded-md bg-neutral-800 p-2 shadow-md transition-all duration-1000">
            <button onClick={onDelete} className="max-h-10 w-full cursor-pointer rounded-md text-left text-sm hover:text-red-700">
                Delete Task
            </button>
        </div>
    );
}
