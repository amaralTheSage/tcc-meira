import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

import { AlertCircle, Code, ImageIcon, List, Minus, Type } from 'lucide-react';
import React from 'react';

interface DocsContextMenuProps {
    children: React.ReactNode;
    onAddText: () => void;
    onAddCode: () => void;
    onAddImage: () => void;
    onAddCallout: () => void;
    onAddDivider: () => void;
    onAddList: () => void;
}

export function DocsContextMenu({ children, onAddText, onAddCode, onAddDivider, onAddCallout, onAddImage, onAddList }: DocsContextMenuProps) {
    const menuItems = [
        { icon: Type, label: 'Text Block', action: onAddText },
        { icon: Code, label: 'Code Block', action: onAddCode },
        { icon: ImageIcon, label: 'Image', action: onAddImage },
        { icon: AlertCircle, label: 'Callout', action: onAddCallout },
        { icon: List, label: 'List', action: onAddList },
        { icon: Minus, label: 'Divider', action: onAddDivider },
    ];

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                {menuItems.map((item) => (
                    <ContextMenuItem key={item.label} inset onSelect={item.action} className="mx-0 w-fit px-5 !pl-5">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </ContextMenuItem>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    );
}
