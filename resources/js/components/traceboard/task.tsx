import { useInitials } from '@/hooks/use-initials';
import { SharedData, User } from '@/types';
import { Tag, TraceboardTask } from '@/types/models';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Workflow } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { TaskContextMenu } from './task-context-menu';
import TitleTextarea from './title-textarea';

interface TaskNodeProps {
    id: string;
    data: TraceboardTask & {
        members: User[];
        projectTags?: Tag[]; // all tags in project
        initialTags?: Tag[]; // tags in this task
    };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Task({
    id,
    data: { members, projectTags, initialTags, title, image, completed, queueOperation, removePendingOpsForTask },
}: NodeProps<TaskNodeProps>) {
    const getInitials = useInitials();
    const { updateNode } = useReactFlow();
    const [isNaming, setIsNaming] = useState(false);

    const [tags, setTags] = useState(initialTags);

    const { data, setData } = useForm({ title: title, image: image });

    const currentTask = { id, image };
    const project_id = usePage().url.split('/')[1];

    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user.id;

    console.log('TAGS: ', tags);

    // Drag Task
    useEcho<{ nodeId: string; type: 'Task' | 'Note'; x: number; y: number; userId: number }>('tasks', 'NodeDragged', (e) => {
        if (e.userId === currentUserId) return; // skip self

        updateNode(e.nodeId, (node) => ({
            ...node,
            data: {
                ...node.data,
            },
            position: {
                x: e.x,
                y: e.y,
            },
        }));
    });

    // Rename Task
    useEcho<{ nodeId: string; type: 'Task' | 'Note'; text: string }>('tasks', 'NodeRenamed', (e) => {
        if (e.type === 'Task' && id === e.nodeId) {
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
            projectTags={projectTags}
            onSetTags={setTags}
            tagsInUse={tags?.map((tag) => tag.id) || []}
            setIsNaming={setIsNaming}
            queueOperation={queueOperation}
            removePendingOpsForTask={removePendingOpsForTask}
        >
            <div
                className={`relative w-sm rounded-md border border-border bg-card p-3 text-[#1b1b18] dark:text-[#EDEDEC] ${completed && 'border-green-500'}`}
            >
                <Handle type="target" position={Position.Left} style={{ background: 'none', border: 'none' }}>
                    {/* Esse div com tamanho maior é para aumentar a área na qual a Handle pode ser agarrada */}
                    <div className="size-20">
                        <div className="relative right-1 bottom-1 size-3 rounded-full border-2 border-white bg-gray-900"></div>
                    </div>
                </Handle>

                {image && <img src={image} alt="alt text" className="mb-2 aspect-video w-full rounded-md object-cover object-center" />}

                <div className="flex justify-end gap-2">
                    {tags?.map((tag, index) => {
                        if (index <= 1) {
                            return (
                                <span style={{ backgroundColor: tag.color }} className="rounded-xl px-4 text-sm text-primary-foreground">
                                    {tag.name}
                                </span>
                            );
                        } else if (index == 2) {
                            return (
                                <span style={{ backgroundColor: tag.color }} className="rounded-xl px-4 text-sm text-primary-foreground">
                                    +{tags?.length - 2}
                                </span>
                            );
                        }
                    })}
                </div>

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
                            <Workflow className="h-4.5! w-4.5!" />
                            <span>
                                {subtasksCompleted}/{totalSubtasks}
                            </span>
                        </Button>
                    </Link>
                </div>

                <div className="h-1 rounded-md bg-green-600" style={{ width: `${(subtasksCompleted / totalSubtasks) * 100}%` }}></div>

                <Handle type="source" position={Position.Right} style={{ background: 'none', border: 'none' }}>
                    <div className="size-20">
                        <div className="relative right-1 bottom-1 size-3 rounded-full border-2 border-white bg-gray-900"></div>
                    </div>
                </Handle>
            </div>
        </TaskContextMenu>
    );
}
