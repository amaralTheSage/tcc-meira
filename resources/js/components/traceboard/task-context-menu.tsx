import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { QueueOperation, Tag } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { useReactFlow } from '@xyflow/react';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { toast } from 'sonner';
import { AddImageDialog } from '../add-image-dialog';
import { ConfirmCompletion } from './confirm-completion';
import TagsSubmenu from './tags-submenu';
import { queueTraceboardNodeDeletes } from './traceboard-node-deletes';

export function TaskContextMenu({
    children,
    id,
    image,
    projectTags,
    onSetTags,
    tagsInUse,
    setIsNaming,
    queueOperation,
    removePendingOpsForTask,
    isMutationLocked = false,
    onContextOpenChange,
    onStartNaming,
}: {
    children: ReactNode;
    id: string;
    image?: string;
    onSetTags: Dispatch<SetStateAction<Tag[]>>;
    projectTags?: Tag[];
    tagsInUse: string[];
    setIsNaming: Dispatch<SetStateAction<boolean>>;
    queueOperation: QueueOperation;
    removePendingOpsForTask: (taskId: string) => void;
    isMutationLocked?: boolean;
    onContextOpenChange?: (open: boolean) => void;
    onStartNaming?: () => void;
}) {
    const { setNodes, updateNode } = useReactFlow();
    const project_id = usePage().url.split('/')[1];

    function RemoveImage() {
        if (isMutationLocked) return;

        updateNode(id, (node) => ({ data: { ...node.data, image: '' } }));

        router.patch(
            route('tasks.update', { project: project_id, task: id }),
            { image_link: 'REMOVE_IMAGE' },
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('An error occurred when removing the image from the task.');
                },
            },
        );
    }

    function CompleteTask() {
        if (isMutationLocked) return;

        updateNode(id, (node) => ({ data: { ...node.data, status: 'completed' } }));

        router.patch(
            route('tasks.complete', { project: project_id, task: id }),
            {},
            {
                preserveScroll: true,
                onError: () => {
                    toast.error('An error occurred when completing the task.');
                },
            },
        );
    }

    function DeleteTask() {
        if (isMutationLocked) return;

        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));

        queueTraceboardNodeDeletes([{ id, type: 'Task' }], removePendingOpsForTask, queueOperation);
    }

    return (
        <ContextMenu onOpenChange={onContextOpenChange}>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                {isMutationLocked ? (
                    <ContextMenuItem inset disabled>
                        Complete Task
                    </ContextMenuItem>
                ) : (
                    <ConfirmCompletion completeTask={CompleteTask}>
                        <ContextMenuItem inset>Complete Task</ContextMenuItem>
                    </ConfirmCompletion>
                )}

                <ContextMenuItem
                    inset
                    disabled={isMutationLocked}
                    onSelect={() => {
                        if (onStartNaming) {
                            onStartNaming();
                            return;
                        }

                        setIsNaming(true);
                    }}
                >
                    Renomear
                </ContextMenuItem>
                {image ? (
                    <ContextMenuItem inset disabled={isMutationLocked} onSelect={RemoveImage}>
                        {/* <Plus strokeWidth={2.5} color="white" /> */}
                        Remover Imagem
                    </ContextMenuItem>
                ) : (
                    <ContextMenuItem
                        inset
                        disabled={isMutationLocked}
                        onSelect={(event) => {
                            event.preventDefault();
                        }}
                    >
                        <AddImageDialog taskId={id}>
                            {/* <Plus strokeWidth={2.5} color="white" /> */}
                            Adicionar Imagem
                        </AddImageDialog>
                    </ContextMenuItem>
                )}

                {isMutationLocked ? (
                    <ContextMenuItem inset disabled>
                        Tags
                    </ContextMenuItem>
                ) : (
                    <TagsSubmenu projectId={project_id} initialTags={projectTags} task_id={id} onSetTags={onSetTags} tagsInUse={tagsInUse} />
                )}

                <ContextMenuItem inset>
                    {/* <SquareArrowUpLeft color="white" strokeWidth={2} /> */}
                    Ver no Kanban
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" inset disabled={isMutationLocked} onSelect={() => DeleteTask()}>
                    Excluir Task
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
