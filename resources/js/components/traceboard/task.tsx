import { useInitials } from '@/hooks/use-initials';
import { TraceboardTask } from '@/types/models';
import { useForm } from '@inertiajs/react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import { TaskContextMenu } from './task-context-menu';

interface TaskNodeProps {
    id: string;
    data: TraceboardTask;
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Task({ id, data: { title, image, queueOperation, removePendingOpsForTask } }: NodeProps<TaskNodeProps>) {
    const getInitials = useInitials();
    const { updateNode } = useReactFlow();
    const [isNaming, setIsNaming] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { patch, data, setData } = useForm({ title: title });

    const currentTask = { id, image };

    function renameTask() {
        updateNode(id, (node) => ({
            ...node,
            data: {
                ...node.data,
                title: data.title,
            },
        }));

        queueOperation({
            type: 'update',
            task: {
                ...currentTask,
                title: data.title,
            },
        });
    }

    useEffect(() => {
        if (isNaming) {
            // BUG
            inputRef.current?.focus();
        }
    }, [isNaming]);

    function submit(e) {
        e.preventDefault();

        setIsNaming(false);

        renameTask();
        // patch(route('tasks.update', { task: id }), {
        //     preserveScroll: true,
        // });
    }

    return (
        <TaskContextMenu
            id={id}
            data={{ title, image }}
            image={image}
            setIsNaming={setIsNaming}
            queueOperation={queueOperation}
            removePendingOpsForTask={removePendingOpsForTask}
        >
            <div className="w-sm rounded-md border border-border bg-card p-3 text-white">
                <Handle type="target" position={Position.Left} />

                {image && <img src={image} alt="alt text" className="mb-2 aspect-video w-full rounded-md object-cover object-top" />}

                <form onSubmit={submit} className="ml-2">
                    {isNaming || !title ? (
                        <input
                            type="text"
                            placeholder="Descreva a etapa do projeto..."
                            ref={inputRef}
                            name="title"
                            id="title"
                            maxLength={38}
                            onChange={(e) => {
                                setData('title', e.target.value);
                            }}
                            onBlur={submit}
                            //value={data.title || ''}
                            autoComplete="off"
                            className="w-full text-muted-foreground focus:outline-none"
                        />
                    ) : (
                        // I did it this way, and didnt use 'disabled' on the input because it made it so the card couldnt be dragged in that area
                        <p>{data.title}</p>
                    )}
                </form>

                {/* <div className="ml-auto flex w-fit flex-row flex-wrap items-center gap-12">
                    <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                        {members &&
                            members.map((member: User) => (
                                <Avatar key={member.id}>
                                    <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                    </div>
                </div> */}

                <Handle type="source" position={Position.Right} />
            </div>
        </TaskContextMenu>
    );
}
