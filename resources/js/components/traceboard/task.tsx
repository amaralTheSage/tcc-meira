import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { TraceboardTask } from '@/types/models';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Check, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { TaskContextMenu } from './task-context-menu';
import TitleTextarea from './title-textarea';

interface TaskNodeProps {
    id: string;
    data: TraceboardTask & { members: User[] };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Task({ id, data: { members, title, image, completed, queueOperation, removePendingOpsForTask } }: NodeProps<TaskNodeProps>) {
    const getInitials = useInitials();
    const { updateNode } = useReactFlow();
    const [isNaming, setIsNaming] = useState(false);

    const { data, setData } = useForm({ title: title, image: image });

    const currentTask = { id, image };
    const project_id = usePage().url.split('/')[1];

    useEcho<{ nodeId: string; type: 'Task' | 'Note'; text: string }>('tasks', 'NodeRenamed', (e) => {
        console.log(e);
        if (e.type === 'Task') {
            setData('title', e.text);

            updateNode(e.nodeId, (node) => ({
                ...node,
                data: {
                    ...node.data,
                    title: e.text,
                },
            }));
        }
    });

    function renameTask() {
        queueOperation({
            type: 'update',
            task: {
                ...currentTask,
                title: data.title,
            },
        });
    }

    function submit(e) {
        e.preventDefault();

        setIsNaming(false);

        renameTask();
    }

    // --------TEMP--------------
    const subtasksCompleted = 3;
    const totalSubtasks = 5;
    // ---------------------

    return (
        <TaskContextMenu
            id={id}
            image={image}
            setIsNaming={setIsNaming}
            queueOperation={queueOperation}
            removePendingOpsForTask={removePendingOpsForTask}
        >
            <div
                className={`relative w-sm rounded-md border border-border bg-card p-3 text-[#1b1b18] dark:text-[#EDEDEC] ${completed && 'border-green-500'}`}
            >
                <Handle type="target" position={Position.Left} />

                {image && <img src={image} alt="alt text" className="mb-2 aspect-video w-full rounded-md object-cover object-center" />}

                {completed && (
                    <span className="absolute top-5 right-5 rounded-full bg-green-600 p-1.5 shadow-md">
                        <Check size={22} />
                    </span>
                )}
                <form onSubmit={submit} className="ml-2">
                    {isNaming || !title ? (
                        <TitleTextarea title={data.title} setData={setData} onBlur={submit} isNaming={isNaming} />
                    ) : (
                        // I did it this way, and didnt use 'disabled' on the input because it made it so the card couldnt be dragged in that area
                        <p
                            className="w-full break-all"
                            onDoubleClick={() => {
                                setIsNaming(!isNaming);
                            }}
                        >
                            {data.title}
                        </p>
                    )}
                </form>

                <div className="flex flex-row flex-wrap items-center justify-between gap-2 py-2">
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

                    <Link href={`/${project_id}/kanban`}>
                        <Button variant="ghost" className="flex h-fit w-fit items-center gap-1 p-2">
                            <Workflow className="!h-4.5 !w-4.5" />
                            <span>
                                {subtasksCompleted}/{totalSubtasks}
                            </span>
                        </Button>
                    </Link>
                </div>

                <div className="h-1 rounded-md bg-green-600" style={{ width: `${(subtasksCompleted / totalSubtasks) * 100}%` }}></div>

                <Handle type="source" position={Position.Right} />
            </div>
        </TaskContextMenu>
    );
}
