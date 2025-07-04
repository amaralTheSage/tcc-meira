import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from '@/components/ui/context-menu';
import { ReactNode } from 'react';

export function PinsContextMenu({ children }: { children: ReactNode }) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
                <ContextMenuItem inset>
                    New Link
                    <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem inset>
                    New Text
                    <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
