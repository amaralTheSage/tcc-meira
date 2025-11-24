import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { queueOperation, Tag } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { useReactFlow } from '@xyflow/react';
import { Dispatch, ReactNode, SetStateAction } from 'react';
import { toast } from 'sonner';
import { AddImageDialog } from '../add-image-dialog';
import TagsSubmenu from './tags-submenu';

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
}: {
    children: ReactNode;
    id: string;
    image?: string;
    onSetTags: Dispatch<SetStateAction<Tag[]>>;
    projectTags?: Tag[];
    tagsInUse: Tag[];
    setIsNaming: Dispatch<SetStateAction<boolean>>;
    queueOperation: queueOperation;
    removePendingOpsForTask: (taskId: string) => void;
}) {
    const { setNodes, updateNode } = useReactFlow();
    const project_id = usePage().url.split('/')[1];

    function RemoveImage() {
        updateNode(id, (node) => ({ data: { ...node.data, image: '' } }));

        router.patch(
            route('tasks.update', { project: project_id, task: id }),
            { image_link: 'REMOVE_IMAGE' },
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error('An error occurred when removing the image from the task.');
                    console.error(errors);
                },
            },
        );
    }

    function DeleteTask() {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));

        removePendingOpsForTask(id);

        queueOperation({
            type: 'delete',
            task: {
                id: id,
            },
        });
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <ContextMenuSub>
                    <ContextMenuItem
                        inset
                        onSelect={() => {
                            setIsNaming(true);
                        }}
                    >
                        Renomear
                    </ContextMenuItem>
                </ContextMenuSub>
                {image ? (
                    <ContextMenuItem inset onSelect={RemoveImage}>
                        {/* <Plus strokeWidth={2.5} color="white" /> */}
                        Remover Imagem
                    </ContextMenuItem>
                ) : (
                    <ContextMenuItem
                        inset
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

                <TagsSubmenu projectId={project_id} initialTags={projectTags} task_id={id} onSetTags={onSetTags} tagsInUse={tagsInUse} />

                <ContextMenuItem inset>
                    {/* <SquareArrowUpLeft color="white" strokeWidth={2} /> */}
                    Ver no Kanban
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" inset onSelect={() => DeleteTask()}>
                    Excluir Task
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
