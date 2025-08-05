import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Check, Workflow } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { TaskContextMenu } from './task-context-menu';
import TitleTextarea from './title-textarea';

interface TaskNodeData {
    id: string;
    members: User[];
    title: string;
    image: string | null;
    completed: boolean;
    queueOperation: (op: {
        type: string;
        node: { id: string; title?: string; image?: string | null; x?: number; y?: number; nodeType: 'Task' };
    }) => void;
    removePendingOpsForNode: (nodeId: string) => void;
}

export default function Task({ id, data }: NodeProps<TaskNodeData>) {
    const { members, title, image, completed, queueOperation, removePendingOpsForNode } = data;
    const getInitials = useInitials();
    const { updateNode } = useReactFlow();
    const [isNaming, setIsNaming] = useState(false);

    const { data: formData, setData } = useForm({ title, image });

    const project_id = usePage().url.split('/')[1];

    function renameNode() {
        updateNode(id, (node) => ({
            ...node,
            data: {
                ...node.data,
                title: formData.title,
            },
        }));

        queueOperation({
            type: 'update',
            node: {
                id,
                title: formData.title,
                nodeType: 'Task',
            },
        });
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setIsNaming(false);
        renameNode();
    }

    // --------TEMP--------------
    const subtasksCompleted = 3;
    const totalSubtasks = 5;
    // ---------------------

    return (
        <TaskContextMenu
            id={id}
            members={members}
            image={image}
            setIsNaming={setIsNaming}
            queueOperation={queueOperation}
            removePendingOpsForNode={removePendingOpsForNode}
        >
            <div
                className={`relative w-sm rounded-md border border-border bg-card p-3 text-[#1b1b18] dark:text-[#EDEDEC] ${
                    completed ? 'border-green-500' : ''
                }`}
            >
                <Handle type="target" position={Position.Left} />

                {image && <img src={image} alt="attachment" className="mb-2 aspect-video w-full rounded-md object-cover object-center" />}

                {completed && (
                    <span className="absolute top-5 right-5 rounded-full bg-green-600 p-1.5 shadow-md">
                        <Check size={22} />
                    </span>
                )}

                <form onSubmit={submit} className="ml-2">
                    {isNaming || !formData.title ? (
                        <TitleTextarea title={formData.title} setData={setData} onBlur={submit} isNaming={isNaming} />
                    ) : (
                        <p className="w-full break-all">{formData.title}</p>
                    )}
                </form>

                <div className="flex flex-row flex-wrap items-center justify-between gap-2 py-2">
                    <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                        {members.map((member) => (
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
