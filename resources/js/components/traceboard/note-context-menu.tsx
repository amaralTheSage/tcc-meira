import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { queueOperation } from '@/types/models';
import { usePage } from '@inertiajs/react';
import { useReactFlow } from '@xyflow/react';
import { Dispatch, ReactNode, SetStateAction } from 'react';

export function NoteContextMenu({
    children,
    id,
    queueOperation,
    removePendingOpsForTask,
}: {
    children: ReactNode;
    id: string;
    setIsNaming: Dispatch<SetStateAction<boolean>>;
    queueOperation: queueOperation;
    removePendingOpsForTask: (taskId: string) => void;
}) {
    const { setNodes } = useReactFlow();
    const project_id = usePage().url.split('/')[1];

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" inset onSelect={() => DeleteNote()}>
                    DeleteNote
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
