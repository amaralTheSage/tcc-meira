import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Page } from '@/types';
import { useState } from 'react';

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';

interface PagesSidebarProps {
    pages: Page[];
    activePage: string;
    onSelectPage: (id: string) => void;
    onAddPage: () => void;
    onUpdatePageName: (id: string, name: string) => void;
    onDeletePage: (id: string) => void;
}

export function PagesSidebar({ pages, activePage, onSelectPage, onAddPage, onUpdatePageName, onDeletePage }: PagesSidebarProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = (page: Page) => {
        setEditingId(page.id);
        setEditValue(page.name);
    };

    const handleEndEdit = (id: string) => {
        if (editValue.trim()) {
            onUpdatePageName(id, editValue.trim());
        }
        setEditingId(null);
    };

    return (
        <aside className="m flex h-full w-64 flex-col">
            <nav className="flex-1 overflow-y-auto p-3">
                <p className="mb-2 p-1 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">Pages</p>
                <ul className="space-y-1">
                    {pages.map((page) => (
                        <ContextMenu key={page.id}>
                            <ContextMenuTrigger asChild>
                                <li className="cursor-pointer">
                                    {editingId === page.id ? (
                                        <>
                                            <Input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onBlur={() => handleEndEdit(page.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleEndEdit(page.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                autoFocus
                                                className="h-8 text-sm"
                                            />
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => onSelectPage(page.id)}
                                            onDoubleClick={() => handleStartEdit(page)}
                                            className={cn(
                                                'group flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-sm transition-colors',
                                                activePage === page.id && 'border-l-8',
                                            )}
                                        >
                                            <span className="flex-1 truncate text-left">{page.name}</span>
                                        </button>
                                    )}

                                    {activePage === page.id &&
                                        page.sections.map((section) => (
                                            <div
                                                key={section.id}
                                                className="mt-1 ml-6 cursor-pointer truncate border-l border-sidebar-border pl-2 text-xs text-muted-foreground hover:text-white"
                                            >
                                                {section.name}
                                            </div>
                                        ))}
                                </li>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                                {pages.length > 1 && (
                                    <ContextMenuItem
                                        variant="destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePage(page.id);
                                        }}
                                    >
                                        Delete
                                    </ContextMenuItem>
                                )}

                                <ContextMenuItem onClick={() => handleStartEdit(page)}>Rename</ContextMenuItem>
                            </ContextMenuContent>
                        </ContextMenu>
                    ))}

                    <Button
                        variant="link"
                        size="sm"
                        onClick={onAddPage}
                        className="mt-4 w-full cursor-pointer text-muted-foreground hover:text-sidebar-foreground"
                    >
                        + Add Page
                    </Button>
                </ul>
            </nav>
        </aside>
    );
}
