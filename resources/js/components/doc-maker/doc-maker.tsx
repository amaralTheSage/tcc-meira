import { ContentBlock, Page } from '@/types';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useRef, useState } from 'react';
import { DocsContextMenu } from './docs-context-menu';
import { DocumentContent } from './document-content';
import { PagesSidebar } from './pages-sidebar';
import { SectionsSidebar } from './sections-sidebar';
import testdata from './testdata';

type CalloutType = NonNullable<ContentBlock['calloutType']>;

export function DocMaker() {
    const [pages, setPages] = useState<Page[]>(testdata);
    const [activePage, setActivePage] = useState<string>('7');
    // Context menu handled elsewhere; remove local state
    const contentRef = useRef<HTMLDivElement>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const currentPage = pages.find((p) => p.id === activePage);

    const handleAddPage = useCallback(() => {
        const newPage: Page = {
            id: Date.now().toString(),
            name: 'New Page',
            sections: [
                {
                    id: `${Date.now()}-1`,
                    name: 'New Section',
                    blocks: [
                        {
                            id: `b-${Date.now()}`,
                            type: 'text',
                            content: 'Start writing your content here...',
                        },
                    ],
                },
            ],
        };
        setPages((prev) => [...prev, newPage]);
        setActivePage(newPage.id);
    }, []);

    const handleAddSection = useCallback(() => {
        setPages((prev) =>
            prev.map((page) => {
                if (page.id === activePage) {
                    return {
                        ...page,
                        sections: [
                            ...page.sections,
                            {
                                id: `${Date.now()}`,
                                name: 'New Section',
                                blocks: [
                                    {
                                        id: `b-${Date.now()}`,
                                        type: 'text',
                                        content: 'Start writing your content here...',
                                    },
                                ],
                            },
                        ],
                    };
                }
                return page;
            }),
        );
    }, [activePage]);

    const handleUpdatePageName = useCallback((pageId: string, name: string) => {
        setPages((prev) => prev.map((page) => (page.id === pageId ? { ...page, name } : page)));
    }, []);

    const handleUpdateSectionName = useCallback(
        (sectionId: string, name: string) => {
            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.map((section) => (section.id === sectionId ? { ...section, name } : section)),
                        };
                    }
                    return page;
                }),
            );
        },
        [activePage],
    );

    const handleUpdateBlock = useCallback(
        (sectionId: string, blockId: string, content: string) => {
            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.map((section) => {
                                if (section.id === sectionId) {
                                    return {
                                        ...section,
                                        blocks: section.blocks.map((block) => (block.id === blockId ? { ...block, content } : block)),
                                    };
                                }
                                return section;
                            }),
                        };
                    }
                    return page;
                }),
            );
        },
        [activePage],
    );

    const handleAddBlock = useCallback(
        (type: ContentBlock['type'], targetSectionId?: string, insertAfterIndex?: number, calloutType?: string) => {
            const newBlock: ContentBlock = {
                id: `b-${Date.now()}`,
                type,
                content: type === 'code' ? '' : type === 'callout' ? 'Important information' : '',
                calloutType: type === 'callout' ? ((calloutType || 'info') as CalloutType) : undefined,
            };

            setPages((prev) =>
                prev.map((page) => {
                    if (page.id !== activePage) return page;

                    const newSections = page.sections.map((s) => ({ ...s, blocks: [...s.blocks] }));

                    // determine which section to add into: prefer explicit target, otherwise the first section
                    const sectionIdToUse = targetSectionId ?? (newSections.length > 0 ? newSections[0].id : undefined);
                    if (!sectionIdToUse) return page;

                    return {
                        ...page,
                        sections: newSections.map((section) => {
                            if (section.id !== sectionIdToUse) return section;

                            const blocks = [...section.blocks];
                            if (typeof insertAfterIndex === 'number') {
                                const idx = Math.max(0, Math.min(insertAfterIndex, blocks.length - 1));
                                blocks.splice(idx + 1, 0, newBlock);
                            } else {
                                blocks.push(newBlock);
                            }
                            return { ...section, blocks };
                        }),
                    };
                }),
            );
        },
        [activePage],
    );

    const handleDeleteBlock = useCallback(
        (sectionId: string, blockId: string) => {
            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.map((section) => {
                                if (section.id === sectionId) {
                                    return {
                                        ...section,
                                        blocks: section.blocks.filter((b) => b.id !== blockId),
                                    };
                                }
                                return section;
                            }),
                        };
                    }
                    return page;
                }),
            );
        },
        [activePage],
    );

    const handleUpdateBlockCalloutType = useCallback(
        (sectionId: string, blockId: string, calloutType: string) => {
            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.map((section) => {
                                if (section.id === sectionId) {
                                    return {
                                        ...section,
                                        blocks: section.blocks.map((block) =>
                                            block.id === blockId ? { ...block, calloutType: calloutType as CalloutType } : block,
                                        ),
                                    };
                                }
                                return section;
                            }),
                        };
                    }
                    return page;
                }),
            );
        },
        [activePage],
    );

    const handleDeletePage = useCallback(
        (pageId: string) => {
            setPages((prev) => {
                const newPages = prev.filter((p) => p.id !== pageId);
                if (activePage === pageId && newPages.length > 0) {
                    setActivePage(newPages[0].id);
                }
                return newPages;
            });
        },
        [activePage],
    );

    const handleDeleteSection = useCallback(
        (sectionId: string) => {
            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.filter((s) => s.id !== sectionId),
                        };
                    }
                    return page;
                }),
            );
        },
        [activePage],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over) return;
            const activeId = String(active.id);
            const overId = String(over.id);
            if (activeId === overId) return;

            const activeSectionId = active.data.current?.sectionId as string | undefined;
            const overSectionId = over.data.current?.sectionId as string | undefined;

            setPages((prev) => {
                return prev.map((page) => {
                    if (page.id !== activePage) return page;

                    const newSections = page.sections.map((s) => ({ ...s, blocks: [...s.blocks] }));

                    // same section reorder
                    if (activeSectionId && overSectionId && activeSectionId === overSectionId) {
                        const sec = newSections.find((s) => s.id === activeSectionId);
                        if (!sec) return page;
                        const oldIndex = sec.blocks.findIndex((b) => b.id === activeId);
                        const newIndex = sec.blocks.findIndex((b) => b.id === overId);
                        sec.blocks = arrayMove(sec.blocks, oldIndex, newIndex);
                        return { ...page, sections: newSections };
                    }

                    // moving between sections
                    const source = newSections.find((s) => s.id === activeSectionId);
                    const dest = newSections.find((s) => s.id === (overSectionId ?? activeSectionId));
                    if (!source || !dest) return page;

                    const movingBlock = source.blocks.find((b) => b.id === activeId);
                    if (!movingBlock) return page;

                    // remove from source
                    source.blocks = source.blocks.filter((b) => b.id !== activeId);

                    // insert into dest at over position
                    const insertIndex = Math.max(
                        0,
                        dest.blocks.findIndex((b) => b.id === overId),
                    );
                    if (insertIndex === -1) {
                        dest.blocks.push(movingBlock);
                    } else {
                        dest.blocks.splice(insertIndex, 0, movingBlock);
                    }

                    return { ...page, sections: newSections };
                });
            });
        },
        [activePage],
    );

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="mx-auto grid h-screen w-full max-w-6xl grid-cols-6 bg-background p-3">
                <PagesSidebar
                    pages={pages}
                    activePage={activePage}
                    onSelectPage={setActivePage}
                    onAddPage={handleAddPage}
                    onUpdatePageName={handleUpdatePageName}
                    onDeletePage={handleDeletePage}
                />

                <DocsContextMenu
                    onAddText={() => handleAddBlock('text')}
                    onAddCode={() => handleAddBlock('code')}
                    onAddImage={() => handleAddBlock('image')}
                    onAddCallout={(calloutType) => handleAddBlock('callout', undefined, undefined, calloutType)}
                    onAddDivider={() => handleAddBlock('divider')}
                    onAddList={() => handleAddBlock('list')}
                >
                    <main ref={contentRef} className="col-span-4 overflow-y-auto">
                        {currentPage && (
                            <DocumentContent
                                page={currentPage}
                                onUpdateSectionName={handleUpdateSectionName}
                                onUpdateBlock={handleUpdateBlock}
                                onUpdateBlockCalloutType={handleUpdateBlockCalloutType}
                                onDeleteBlock={handleDeleteBlock}
                                onDeleteSection={handleDeleteSection}
                            />
                        )}
                    </main>
                </DocsContextMenu>

                <SectionsSidebar sections={currentPage?.sections || []} onAddSection={handleAddSection} />
            </div>
        </DndContext>
    );
}
