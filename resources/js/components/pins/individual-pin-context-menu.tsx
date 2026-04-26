import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Pinned } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { toast } from 'sonner';
import AddPinsDialog from './add-pin-dialog';

export function IndividualPinContextMenu({
    children,
    pins,
    id,
    setPins,
}: {
    children: ReactNode;
    pins: Pinned[];
    id: string;
    setPins: React.Dispatch<React.SetStateAction<Pinned[]>>;
}) {
    const project_id = usePage().url.split('/')[1];

    function removePin() {
        router.delete(route('pins.destroy', { project: project_id, pin: id }), {
            onSuccess: () => {
                setPins(pins.filter((pin) => pin.id !== id));
            },
            onError: () => {
                toast.error(`Error occurred when deleting pin.`);
            },
        });
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <AddPinsDialog type="link" pins={pins} setPins={setPins}>
                    <ContextMenuItem
                        inset
                        onSelect={(e) => {
                            e.preventDefault();
                        }}
                    >
                        New Link
                    </ContextMenuItem>
                </AddPinsDialog>
                <AddPinsDialog type="text" pins={pins} setPins={setPins}>
                    <ContextMenuItem
                        inset
                        onSelect={(e) => {
                            e.preventDefault();
                        }}
                    >
                        New Text
                    </ContextMenuItem>
                </AddPinsDialog>
                <ContextMenuItem inset variant="destructive" onSelect={removePin}>
                    Remove Pin
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
