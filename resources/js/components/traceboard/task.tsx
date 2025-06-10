import { useInitials } from '@/hooks/use-initials';
import { TraceboardTask } from '@/types/models';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { SetStateAction, useEffect, useState } from 'react';
import { TaskContextMenu } from './task-context-menu';

interface TaskNodeProps {
    id: string;
    data: TraceboardTask;
    position: { x: number; y: number };
}

export default function Task({ id, data: { title, image } }: NodeProps<TaskNodeProps>) {
    const getInitials = useInitials();
    const [newTitle, setNewTitle] = useState<SetStateAction<string>>();
    const { updateNode } = useReactFlow();

    useEffect(() => {
        console.log(title);
    }, []);

    return (
        <TaskContextMenu id={id} image={image}>
            <div className="w-sm rounded-md border border-border bg-card p-3 text-white">
                <Handle type="target" position={Position.Left} />

                {image && <img src={image} alt="alt text" className="aspect-video w-full rounded-md object-cover object-top" />}
                {title ? (
                    <p className="mt-2">{title}</p>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            updateNode(id, (node) => ({ ...node.data, data: { title: newTitle } }));
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Descreva a etapa do projeto..."
                            name="node-title"
                            autoComplete="off"
                            className="w-full focus:outline-none"
                            onChange={(e) => {
                                setNewTitle(e.target.value);
                            }}
                        />
                    </form>
                )}

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
