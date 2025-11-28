import type React from 'react';

import { ContentBlock, Page } from '@/types';
import { useCallback, useRef, useState } from 'react';
import { ContextMenu } from './docs-context-menu';
import { DocumentContent } from './document-content';
import { PagesSidebar } from './pages-sidebar';
import { SectionsSidebar } from './sections-sidebar';
import testdata from './testdata';

export function DocMaker() {
    const [pages, setPages] = useState<Page[]>(testdata);
    const [activePage, setActivePage] = useState<string>('1');
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        sectionId: string;
        blockIndex: number;
    } | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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

    const handleContextMenu = useCallback((e: React.MouseEvent, sectionId: string, blockIndex: number) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            sectionId,
            blockIndex,
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleAddBlock = useCallback(
        (type: ContentBlock['type'], language?: string) => {
            if (!contextMenu) return;

            const newBlock: ContentBlock = {
                id: `b-${Date.now()}`,
                type,
                content: type === 'code' ? '// Your code here' : type === 'callout' ? 'Important information' : '',
                language: type === 'code' ? language || 'javascript' : undefined,
                calloutType: type === 'callout' ? 'info' : undefined,
            };

            setPages((prev) =>
                prev.map((page) => {
                    if (page.id === activePage) {
                        return {
                            ...page,
                            sections: page.sections.map((section) => {
                                if (section.id === contextMenu.sectionId) {
                                    const newBlocks = [...section.blocks];
                                    newBlocks.splice(contextMenu.blockIndex + 1, 0, newBlock);
                                    return { ...section, blocks: newBlocks };
                                }
                                return section;
                            }),
                        };
                    }
                    return page;
                }),
            );
            setContextMenu(null);
        },
        [activePage, contextMenu],
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

    return (
        <div className="flex h-screen bg-background p-3" onClick={handleCloseContextMenu}>
            <PagesSidebar
                pages={pages}
                activePage={activePage}
                onSelectPage={setActivePage}
                onAddPage={handleAddPage}
                onUpdatePageName={handleUpdatePageName}
                onDeletePage={handleDeletePage}
            />

            <main ref={contentRef} className="flex-1 overflow-y-auto">
                {currentPage && (
                    <DocumentContent
                        page={currentPage}
                        onUpdateSectionName={handleUpdateSectionName}
                        onUpdateBlock={handleUpdateBlock}
                        onContextMenu={handleContextMenu}
                        onDeleteBlock={handleDeleteBlock}
                        onDeleteSection={handleDeleteSection}
                    />
                )}
            </main>

            <SectionsSidebar sections={currentPage?.sections || []} onAddSection={handleAddSection} />

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onAddText={() => handleAddBlock('text')}
                    onAddCode={() => handleAddBlock('code')}
                    onAddImage={() => handleAddBlock('image')}
                    onAddCallout={() => handleAddBlock('callout')}
                    onAddDivider={() => handleAddBlock('divider')}
                    onAddList={() => handleAddBlock('list')}
                    onClose={handleCloseContextMenu}
                />
            )}
        </div>
    );
}
