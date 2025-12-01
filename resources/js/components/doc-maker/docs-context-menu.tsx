import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

import { AlertCircle, AlertTriangle, CheckCircle, Code, ImageIcon, Info, List, Minus, Type } from 'lucide-react';
import React from 'react';

interface DocsContextMenuProps {
    children: React.ReactNode;
    onAddText: () => void;
    onAddCode: () => void;
    onAddImage: () => void;
    onAddCallout: (calloutType: string) => void;
    onAddDivider: () => void;
    onAddList: () => void;
}

export function DocsContextMenu({ children, onAddText, onAddCode, onAddDivider, onAddCallout, onAddImage, onAddList }: DocsContextMenuProps) {
    const calloutVariants = [
        { label: 'Info', type: 'info', icon: Info },
        { label: 'Warning', type: 'warning', icon: AlertTriangle },
        { label: 'Success', type: 'success', icon: CheckCircle },
        { label: 'Error', type: 'error', icon: AlertCircle },
    ];

    const menuItems = [
        { icon: Type, label: 'Text Block', action: onAddText },
        { icon: Code, label: 'Code Block', action: onAddCode },
        { icon: ImageIcon, label: 'Image', action: onAddImage },
        { icon: List, label: 'List', action: onAddList },
        { icon: Minus, label: 'Divider', action: onAddDivider },
    ];

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                {menuItems.map((item) => (
                    <ContextMenuItem key={item.label} inset onSelect={item.action} className="mx-0 w-full px-10 !pl-4">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                    </ContextMenuItem>
                ))}
                <ContextMenuSub>
                    <ContextMenuSubTrigger inset className="mx-0 w-full !pl-4">
                        <AlertCircle className="mr-4 h-4 w-4" />
                        Callout
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        {calloutVariants.map((variant) => (
                            <ContextMenuItem key={variant.type} inset onSelect={() => onAddCallout(variant.type)} className="mx-0 w-full !px-4">
                                <variant.icon className="mr-2 h-4 w-4" />
                                {variant.label}
                            </ContextMenuItem>
                        ))}
                    </ContextMenuSubContent>
                </ContextMenuSub>
            </ContextMenuContent>
        </ContextMenu>
    );
}
