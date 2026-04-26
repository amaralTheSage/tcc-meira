import { Button } from '@/components/ui/button';
import { markdownToHtml } from '@/lib/docs-markdown';
import { cn } from '@/lib/utils';
import { Project, ProjectDocument } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import SharedProjectLayout from './layout';

export default function SharedDocs({ project, documents, activeDocument }: { project: Project; documents: ProjectDocument[]; activeDocument: ProjectDocument }) {
    const [documentId, setDocumentId] = useState(activeDocument.id);
    const currentDocument = documents.find((document) => document.id === documentId) ?? activeDocument;
    const html = useMemo(() => markdownToHtml(currentDocument.markdown), [currentDocument.markdown]);

    return (
        <SharedProjectLayout active="docs" project={project}>
            <Head title={`${project.title} Docs`} />
            <main className="grid min-h-[calc(100vh-13rem)] grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <aside className="border-r border-border bg-sidebar/50 p-3">
                    {documents.map((document) => (
                        <Button
                            key={document.id}
                            variant="ghost"
                            className={cn('mb-1 w-full justify-start truncate', document.id === currentDocument.id && 'bg-accent')}
                            onClick={() => setDocumentId(document.id)}
                        >
                            {document.title}
                        </Button>
                    ))}
                </aside>
                <article className="prose prose-invert max-w-none p-6" dangerouslySetInnerHTML={{ __html: html }} />
            </main>
        </SharedProjectLayout>
    );
}
