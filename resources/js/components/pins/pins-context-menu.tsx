import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Pinned } from '@/types/models';
import { ReactNode } from 'react';
import AddPinsDialog from './add-pin-dialog';

export function PinsContextMenu({
    children,
    pins,
    setPins,
}: {
    children: ReactNode;
    pins: Pinned[];
    setPins: React.Dispatch<React.SetStateAction<Pinned[]>>;
}) {
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
            </ContextMenuContent>
        </ContextMenu>
    );
}
