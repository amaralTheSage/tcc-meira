import { TraceboardTask } from '@/types/models';
import { Handle, Position } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTaskUpdate } from './board'; // Import the context hook
import { TaskContextMenu } from './task-context-menu';

interface TaskNodeProps {
    id: string;
    data: TraceboardTask & { isLocal?: boolean };
    position: { x: number; y: number };
}

// Debounce hook
function useDebounce(callback: Function, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout>(0);

    return useCallback(
        (...args: any[]) => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => callback(...args), delay);
        },
        [callback, delay],
    );
}

export default function Task({ id, data }: TaskNodeProps) {
    const { title, image, isLocal } = data;
    const updateTask = useTaskUpdate(); // Use the context
    const inputRef = useRef<HTMLInputElement>(null);
    const [localTitle, setLocalTitle] = useState(title || '');

    // Simple debounced update using the Board's optimistic system
    const debouncedSave = useDebounce((newTitle: string) => {
        if (isLocal || newTitle === title) return;
        updateTask(id, { title: newTitle });
    }, 1000);

    // Handle input changes
    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newTitle = e.target.value;
            setLocalTitle(newTitle);
            debouncedSave(newTitle);
        },
        [debouncedSave],
    );

    // Update local state when prop changes (from server updates)
    useEffect(() => {
        setLocalTitle(title || '');
    }, [title]);

    return (
        <TaskContextMenu id={id} data={{ title: localTitle, image }} image={image}>
            <div className={`relative w-sm rounded-md border border-border bg-card p-3 text-white ${isLocal ? 'opacity-75' : ''}`}>
                {/* Loading indicator for unsaved local tasks */}
                {isLocal && <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-yellow-500" title="Creating task..." />}

                <Handle type="target" position={Position.Left} />

                {image && <img src={image} alt="Task image" className="mb-2 aspect-video w-full rounded-md object-cover object-top" />}

                <form
                    onSubmit={(e: React.FormEvent) => {
                        e.preventDefault();
                        inputRef.current?.blur();
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Descreva a etapa do projeto..."
                        name="title"
                        value={localTitle}
                        onChange={handleTitleChange}
                        autoComplete="off"
                        className="w-full bg-transparent placeholder:text-gray-400 focus:outline-none"
                        disabled={isLocal} // Disable editing while creating
                    />
                </form>

                <Handle type="source" position={Position.Right} />
            </div>
        </TaskContextMenu>
    );
}
