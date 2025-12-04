import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Trash } from 'lucide-react';

import React from 'react';

interface BlockContextMenuProps {
    children: React.ReactNode;
    blockType?: 'text' | 'code' | 'image' | 'callout' | 'divider' | 'list'; // reserved for future differentiation
    onDelete: () => void;
}

export function BlockContextMenu({ children, onDelete }: BlockContextMenuProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem className="mx-0 w-fit px-5 !pl-5" variant="destructive" onSelect={onDelete}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Block
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
