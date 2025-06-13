import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { router } from '@inertiajs/react';
import { useReactFlow } from '@xyflow/react';
import { ReactNode } from 'react';
import { toast } from 'sonner';

const tempImage =
    'https://cdn.americachip.com/wp-content/uploads/2020/04/o-que-fazer-em-nova-york.jpg?strip=all&lossy=1&quality=92&webp=92&resize=1020%2C608&ssl=1';

export function TaskContextMenu({ children, id, data, image }: { children: ReactNode; id: string; data: any; image?: string }) {
    const { setNodes, updateNode } = useReactFlow();

    function addImage(src: string) {
        updateNode(id, (node) => ({ data: { ...node.data, image: src } }));
    }

    function RemoveImage() {
        updateNode(id, (node) => ({ data: { ...node.data, image: '' } }));
    }

    function DeleteTask() {
        router.delete(route('tasks.destroy', { task: id }), {
            preserveScroll: true,
            onSuccess: () => {
                toast('Task deleted', {
                    description: `Task "${data.title}" deleted!`,
                });
            },
            onError: (errors) => {
                toast.error('Erro ao criar palestra.');
                console.error(errors);
            },
        });

        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset>Atribuir</ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuLabel inset>Membros</ContextMenuLabel>
                        <ContextMenuCheckboxItem
                            onSelect={(event) => {
                                event.preventDefault();
                            }}
                            // evita que feche
                        >
                            Gabriel
                        </ContextMenuCheckboxItem>
                        <ContextMenuCheckboxItem
                            onSelect={(event) => {
                                event.preventDefault();
                            }}
                        >
                            Lorenzo
                        </ContextMenuCheckboxItem>
                        <ContextMenuCheckboxItem>Ahd ahahah</ContextMenuCheckboxItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                {image ? (
                    <ContextMenuItem inset onSelect={() => RemoveImage()}>
                        {/* <Plus strokeWidth={2.5} color="white" /> */}
                        Remover Imagem
                    </ContextMenuItem>
                ) : (
                    <ContextMenuItem inset onSelect={() => addImage(tempImage)}>
                        {/* <Plus strokeWidth={2.5} color="white" /> */}
                        Adicionar Imagem
                    </ContextMenuItem>
                )}

                <ContextMenuItem inset>
                    {/* <SquareArrowUpLeft color="white" strokeWidth={2} /> */}
                    Levar ao Kanban
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" inset onSelect={() => DeleteTask()}>
                    Excluir Task
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
