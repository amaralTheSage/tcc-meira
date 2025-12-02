import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Page } from '@/types';
import { SortableContext } from '@dnd-kit/sortable';
import { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { BlockContextMenu } from './block-context-menu';
import { ContentBlockEditor } from './content-block-editor';

interface DocumentContentProps {
    page: Page;
    onUpdateSectionName: (sectionId: string, name: string) => void;
    onUpdateBlock: (sectionId: string, blockId: string, content: string) => void;
    onUpdateBlockCalloutType?: (sectionId: string, blockId: string, calloutType: string) => void;
    onDeleteBlock: (sectionId: string, blockId: string) => void;
    onDeleteSection: (sectionId: string) => void;
}

export function DocumentContent({
    page,
    onUpdateSectionName,
    onUpdateBlock,
    onUpdateBlockCalloutType,
    onDeleteBlock,
    onDeleteSection,
}: DocumentContentProps) {
    const [editingPageName, setEditingPageName] = useState(false);
    const [pageNameValue, setPageNameValue] = useState(page.name);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [sectionNameValue, setSectionNameValue] = useState('');
    const [deleteConfirmSectionId, setDeleteConfirmSectionId] = useState<string | null>(null);

    const handleStartEditSection = (section: { id: string; name: string }) => {
        setEditingSectionId(section.id);
        setSectionNameValue(section.name);
    };

    const handleEndEditSection = (sectionId: string) => {
        if (sectionNameValue.trim()) {
            onUpdateSectionName(sectionId, sectionNameValue.trim());
        }
        setEditingSectionId(null);
    };

    return (
        <ScrollArea className="h-full" type="always">
            <div className="mx-auto h-full w-full px-8 py-12">
                {/* Page Title */}
                <div className="mb-10">
                    {editingPageName ? (
                        <Input
                            value={pageNameValue}
                            onChange={(e) => setPageNameValue(e.target.value)}
                            onBlur={() => setEditingPageName(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === 'Escape') {
                                    setEditingPageName(false);
                                }
                            }}
                            autoFocus
                            className="h-auto rounded-none border-0 border-b-2 px-0 py-2 !text-4xl focus-visible:ring-0"
                        />
                    ) : (
                        <h1
                            onClick={() => {
                                setEditingPageName(true);
                                setPageNameValue(page.name);
                            }}
                            className="-mx-1 cursor-text rounded px-1 text-4xl text-foreground transition-colors hover:bg-accent/50"
                        >
                            {page.name}
                        </h1>
                    )}
                </div>

                {/* Sections */}
                {page.sections.map((section, sectionIndex) => (
                    <section key={section.id} id={`section-${section.id}`} className="mb-12 scroll-mt-8">
                        {/* Section Header */}
                        <div className="group mb-4 flex items-center gap-2">
                            {editingSectionId === section.id ? (
                                <Input
                                    value={sectionNameValue}
                                    onChange={(e) => setSectionNameValue(e.target.value)}
                                    onBlur={() => handleEndEditSection(section.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEndEditSection(section.id);
                                        if (e.key === 'Escape') setEditingSectionId(null);
                                    }}
                                    autoFocus
                                    className="!h-auto rounded-none border-0 border-b-2 px-0 py-1 !text-2xl font-semibold focus-visible:ring-0"
                                />
                            ) : (
                                <>
                                    <h2
                                        onClick={() => handleStartEditSection(section)}
                                        className="-mx-1 flex-1 cursor-text rounded px-1 text-2xl text-foreground transition-colors hover:bg-accent/50"
                                    >
                                        {section.name}
                                    </h2>
                                    {page.sections.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setDeleteConfirmSectionId(section.id)}
                                                className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                                            >
                                                Remove
                                            </button>
                                            <AlertDialog
                                                open={deleteConfirmSectionId === section.id}
                                                onOpenChange={(open) => !open && setDeleteConfirmSectionId(null)}
                                            >
                                                <AlertDialogContent>
                                                    <AlertDialogTitle>Delete Section</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete section "{section.name}"? This will permanently delete all
                                                        content within it.
                                                    </AlertDialogDescription>
                                                    <div className="flex justify-end gap-2">
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                onDeleteSection(section.id);
                                                                setDeleteConfirmSectionId(null);
                                                            }}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </div>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Content Blocks */}
                        <SortableContext items={section.blocks.map((b) => b.id)}>
                            <div className="space-y-4">
                                {section.blocks.map((block, blockIndex) => (
                                    <BlockContextMenu blockType={block.type} key={block.id} onDelete={() => onDeleteBlock(section.id, block.id)}>
                                        <ContentBlockEditor
                                            key={block.id}
                                            block={block}
                                            sectionId={section.id}
                                            onUpdate={(content) => onUpdateBlock(section.id, block.id, content)}
                                            onUpdateCalloutType={(calloutType) => onUpdateBlockCalloutType?.(section.id, block.id, calloutType)}
                                            onDelete={() => onDeleteBlock(section.id, block.id)}
                                            canDelete={section.blocks.length > 1}
                                        />
                                    </BlockContextMenu>
                                ))}
                            </div>
                        </SortableContext>
                    </section>
                ))}
            </div>
        </ScrollArea>
    );
}
