import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Pinned } from '@/types/models';
import { ReactNode } from 'react';
import AddPinsDialog from './add-pin-dialog';

export function PinsContextMenu({ children, pins }: { children: ReactNode; pins: Pinned[] }) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <AddPinsDialog type="link" pins={pins}>
                    <ContextMenuItem
                        inset
                        onSelect={(e) => {
                            e.preventDefault();
                        }}
                    >
                        New Link
                    </ContextMenuItem>
                </AddPinsDialog>

                <AddPinsDialog type="text" pins={pins}>
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
