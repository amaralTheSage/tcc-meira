import { AlertCircle, Code, ImageIcon, List, Minus, Type } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    onAddText: () => void;
    onAddCode: () => void;
    onAddImage: () => void;
    onAddCallout: () => void;
    onAddDivider: () => void;
    onAddList: () => void;
    onClose: () => void;
}

const menuItems = [
    { icon: Type, label: 'Text Block', action: 'text' },
    { icon: Code, label: 'Code Block', action: 'code' },
    { icon: ImageIcon, label: 'Image', action: 'image' },
    { icon: AlertCircle, label: 'Callout', action: 'callout' },
    { icon: List, label: 'List', action: 'list' },
    { icon: Minus, label: 'Divider', action: 'divider' },
];

export function ContextMenu({ x, y, onAddText, onAddCode, onAddImage, onAddCallout, onAddDivider, onAddList, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Adjust position if menu would go off screen
    const adjustedX = Math.min(x, window.innerWidth - 200);
    const adjustedY = Math.min(y, window.innerHeight - 300);

    const handleAction = (action: string) => {
        switch (action) {
            case 'text':
                onAddText();
                break;
            case 'code':
                onAddCode();
                break;
            case 'image':
                onAddImage();
                break;
            case 'callout':
                onAddCallout();
                break;
            case 'divider':
                onAddDivider();
                break;
            case 'list':
                onAddList();
                break;
        }
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-48 rounded-lg border border-border bg-popover py-1 shadow-lg animate-in fade-in-0 zoom-in-95"
            style={{ left: adjustedX, top: adjustedY }}
            onClick={(e) => e.stopPropagation()}
        >
            <p className="px-3 py-1.5 text-xs font-medium tracking-wider text-muted-foreground uppercase">Add Block</p>
            {menuItems.map((item) => (
                <button
                    key={item.action}
                    onClick={() => handleAction(item.action)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
                >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                </button>
            ))}
        </div>
    );
}
