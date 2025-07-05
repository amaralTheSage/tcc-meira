import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ReactNode } from 'react';
import AddPinsDialog from './add-pin-dialog';

export function IndividualPinContextMenu({ children, pins_length }: { children: ReactNode; pins_length: number }) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <AddPinsDialog type="link" pins_length={pins_length}>
                    <ContextMenuItem
                        inset
                        onSelect={(e) => {
                            e.preventDefault();
                        }}
                    >
                        New Link
                    </ContextMenuItem>
                </AddPinsDialog>
                <AddPinsDialog type="text" pins_length={pins_length}>
                    <ContextMenuItem
                        inset
                        onSelect={(e) => {
                            e.preventDefault();
                        }}
                    >
                        New Text
                    </ContextMenuItem>
                </AddPinsDialog>
                <ContextMenuItem inset variant="destructive">
                    Remove Pin
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
