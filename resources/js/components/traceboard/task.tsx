import { SprintBadge } from '@/components/sprint-badge';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { Sprint, Tag, TraceboardTask } from '@/types/models';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Handle, type Node, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Workflow } from 'lucide-react';
import { type FocusEvent, type FormEvent, type MouseEvent, type PointerEvent, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { TaskContextMenu } from './task-context-menu';
import TitleTextarea from './title-textarea';
import { TraceboardNodeLockBadge } from './traceboard-node-lock-badge';
import type { TraceboardNodeLockData } from './traceboard-node-touch-locks';
import { traceboardUserAccentColor, traceboardUserAccentShadow } from './traceboard-user-colors';

export interface TaskNodeData extends TraceboardTask, TraceboardNodeLockData, Record<string, unknown> {
    members: User[];
    projectTags?: Tag[];
    initialTags?: Tag[];
    sprints?: Sprint[];
}

type TaskNodeProps = Node<TaskNodeData, 'Task'>;

export default function Task({
    id,
    data: {
        members,
        projectTags,
        initialTags,
        title,
        image,
        status,
        sprint_id,
        sprints,
        queueOperation,
        removePendingOpsForTask,
        touchLock,
        touchLockIsLocal,
        touchLockIsRemote,
        startTouchLock,
        endTouchLock,
    },
}: NodeProps<TaskNodeProps>) {
    const getInitials = useInitials();
    const { updateNode } = useReactFlow();
    const [isNaming, setIsNaming] = useState(false);

    const [tags, setTags] = useState<Tag[]>(initialTags ?? []);

    const { data, setData } = useForm({ title: title ?? '', image: image ?? null });

    const currentTask = { id, image };
    const project_id = usePage().url.split('/')[1];

    const completed = status === 'completed';
    const sprint = sprints?.find((projectSprint) => String(projectSprint.id) === String(sprint_id));
    const lockStyle = touchLock
        ? {
              borderColor: traceboardUserAccentColor(touchLock.user.id),
              boxShadow: traceboardUserAccentShadow(touchLock.user.id),
          }
        : undefined;

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
        if (touchLockIsRemote) {
            return;
        }

        queueOperation({
            type: 'update',
            task: {
                ...currentTask,
                title: data.title,
            },
        });
    }

    function submit(e: FormEvent<HTMLFormElement> | FocusEvent<HTMLTextAreaElement>) {
        e.preventDefault();

        setIsNaming(false);
        endTouchLock?.(id, 'Task', 'editing');

        renameTask();
    }

    function openNaming(): void {
        if (touchLockIsRemote) {
            return;
        }

        startTouchLock?.(id, 'Task', 'editing');
        setIsNaming(true);
    }

    function stopRemoteLockedPointer(event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>): void {
        if (!touchLockIsRemote) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
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
            tagsInUse={tags.map((tag) => tag.id)}
            setIsNaming={setIsNaming}
            queueOperation={queueOperation}
            removePendingOpsForTask={removePendingOpsForTask}
            isMutationLocked={Boolean(touchLockIsRemote)}
            onContextOpenChange={(open) => {
                if (touchLockIsRemote) {
                    return;
                }

                if (open) {
                    startTouchLock?.(id, 'Task', 'context');
                    return;
                }

                endTouchLock?.(id, 'Task', 'context');
            }}
            onStartNaming={openNaming}
        >
            <div
                className={cn(
                    'relative w-sm rounded-md border border-border bg-card p-3 text-[#1b1b18] transition-[border-color,box-shadow] dark:text-[#EDEDEC]',
                    completed && !touchLock && 'border-green-500',
                )}
                data-testid={`traceboard-task-${id}`}
                onContextMenuCapture={stopRemoteLockedPointer}
                onPointerDownCapture={stopRemoteLockedPointer}
                style={lockStyle}
            >
                <TraceboardNodeLockBadge isLocal={touchLockIsLocal} lock={touchLock} />

                <Handle type="target" position={Position.Left} isConnectable={!touchLockIsRemote} style={{ background: 'none', border: 'none' }}>
                    {/* Esse div com tamanho maior é para aumentar a área na qual a Handle pode ser agarrada */}
                    <div className="size-20">
                        <div className="relative right-1 bottom-1 size-3 rounded-full border-2 border-white bg-gray-900"></div>
                    </div>
                </Handle>

                {image && <img src={image} alt="alt text" className="mb-2 aspect-video w-full rounded-md object-cover object-center" />}

                <div className="mb-2 flex items-start justify-between gap-2">
                    {sprint && <SprintBadge sprint={sprint} />}
                    <div className="ml-auto flex flex-wrap justify-end gap-2">
                        {tags.map((tag, index) => {
                            if (index <= 1) {
                                return (
                                    <span
                                        key={tag.id}
                                        style={{ backgroundColor: tag.color }}
                                        className="rounded-xl px-4 text-sm text-primary-foreground"
                                    >
                                        {tag.name}
                                    </span>
                                );
                            } else if (index == 2) {
                                return (
                                    <span
                                        key={tag.id}
                                        style={{ backgroundColor: tag.color }}
                                        className="rounded-xl px-4 text-sm text-primary-foreground"
                                    >
                                        +{tags.length - 2}
                                    </span>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>

                <form onSubmit={submit} className="ml-2">
                    {isNaming || (!title && !touchLockIsRemote) ? (
                        <TitleTextarea title={data.title} setData={(field, value) => setData(field, value)} onBlur={submit} isNaming={isNaming} />
                    ) : (
                        // I did it this way, and didnt use 'disabled' on the input because it made it so the card couldnt be dragged in that area
                        <p
                            className="w-full break-all"
                            onDoubleClick={() => {
                                openNaming();
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
                                    <AvatarImage src={member.avatar ?? undefined} alt={member.name} className="object-cover" />
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

                <div
                    className="h-1 rounded-md bg-green-600"
                    style={{ width: `${completed ? 100 : (subtasksCompleted / totalSubtasks) * 100}%` }}
                ></div>

                <Handle type="source" position={Position.Right} isConnectable={!touchLockIsRemote} style={{ background: 'none', border: 'none' }}>
                    <div className="size-20">
                        <div className="relative right-1 bottom-1 size-3 rounded-full border-2 border-white bg-gray-900"></div>
                    </div>
                </Handle>
            </div>
        </TaskContextMenu>
    );
}
