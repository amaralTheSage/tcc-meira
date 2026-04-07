import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formHeaders, jsonHeaders } from '@/lib/docs-http';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import type { Project, ProjectDocument } from '@/types/models';
import { Link, router, usePage } from '@inertiajs/react';
import { useEchoPresence } from '@laravel/echo-react';
import { FilePlus2, Plus, Trash2, UsersRound } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { DocumentEditor } from './document-editor';
import type { RemoteCursorSelection } from './remote-cursors';

interface ProjectDocsWorkspaceProps {
    activeDocument: ProjectDocument;
    documents: ProjectDocument[];
    project: Project;
}

interface CollaborationUser {
    avatar?: string | null;
    id: number;
    name: string;
}

interface DocumentSavedPayload {
    document: ProjectDocument;
    editor: CollaborationUser;
}

interface SelectionWhisperPayload {
    color: string;
    from: number;
    name: string;
    to: number;
    userId: number;
}

type SaveStatus = 'Saved' | 'Saving...' | 'Unsaved' | 'Conflict' | 'Upload failed';

interface PresenceChannel {
    here(callback: (users: CollaborationUser[]) => void): void;
    joining(callback: (user: CollaborationUser) => void): void;
    leaving(callback: (user: CollaborationUser) => void): void;
    listenForWhisper(event: string, callback: (payload: SelectionWhisperPayload) => void): void;
    whisper(event: string, payload: SelectionWhisperPayload): void;
}

export function ProjectDocsWorkspace({ activeDocument, documents, project }: ProjectDocsWorkspaceProps) {
    const { auth } = usePage<SharedData>().props;
    const [documentList, setDocumentList] = useState<ProjectDocument[]>(documents);
    const [currentDocument, setCurrentDocument] = useState<ProjectDocument>(activeDocument);
    const [markdown, setMarkdown] = useState(activeDocument.markdown);
    const [version, setVersion] = useState(activeDocument.version);
    const [title, setTitle] = useState(activeDocument.title);
    const [newTitle, setNewTitle] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [status, setStatus] = useState<SaveStatus>('Saved');
    const [conflictDocument, setConflictDocument] = useState<ProjectDocument | null>(null);
    const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
    const [remoteSelections, setRemoteSelections] = useState<RemoteCursorSelection[]>([]);
    const latestMarkdown = useRef(markdown);
    const lastWhisperedAt = useRef(0);
    const channelName = useMemo(() => `project.${project.id}.docs.${currentDocument.id}`, [project.id, currentDocument.id]);

    const applyDocument = useCallback((document: ProjectDocument) => {
        setCurrentDocument(document);
        setMarkdown(document.markdown);
        setVersion(document.version);
        setTitle(document.title);
        setIsDirty(false);
        setConflictDocument(null);
        setStatus('Saved');
        setDocumentList((current) => replaceDocument(current, document));
    }, []);

    const handleRemoteSave = useCallback((payload: DocumentSavedPayload) => {
        if (payload.document.id !== currentDocument.id || payload.document.version <= version) return;
        if (isDirty) {
            setConflictDocument(payload.document);
            setStatus('Conflict');
            return;
        }

        applyDocument(payload.document);
    }, [applyDocument, currentDocument.id, isDirty, version]);

    const { channel } = useEchoPresence<DocumentSavedPayload>(channelName, 'ProjectDocumentSaved', handleRemoteSave, [channelName, handleRemoteSave]);

    const handleSaveResponse = useCallback(async (response: Response, markdownAtSave: string): Promise<void> => {
        const payload = (await response.json()) as { document: ProjectDocument };
        if (response.status === 409) {
            setConflictDocument(payload.document);
            setStatus('Conflict');
            return;
        }

        if (!response.ok) throw new Error(`Failed to save document: got ${response.status}, expected 200.`);
        setVersion(payload.document.version);
        setCurrentDocument(payload.document);
        setDocumentList((current) => replaceDocument(current, payload.document));
        if (latestMarkdown.current === markdownAtSave) setIsDirty(false);
        setStatus('Saved');
    }, []);

    const saveContent = useCallback(async (): Promise<void> => {
        const markdownAtSave = latestMarkdown.current;
        setStatus('Saving...');

        try {
            const response = await sendSaveRequest(project.id, currentDocument.id, markdownAtSave, version);
            await handleSaveResponse(response, markdownAtSave);
        } catch {
            setStatus('Unsaved');
        }
    }, [currentDocument.id, handleSaveResponse, project.id, version]);

    useEffect(() => {
        latestMarkdown.current = markdown;
    }, [markdown]);

    useEffect(() => {
        setDocumentList(documents);
        applyDocument(activeDocument);
    }, [activeDocument, applyDocument, documents]);

    useEffect(() => {
        registerPresenceListeners(channel() as PresenceChannel, auth.user.id, setCollaborators, setRemoteSelections);
    }, [auth.user.id, channel, channelName]);

    useEffect(() => {
        if (!isDirty || conflictDocument) return;

        setStatus('Unsaved');
        const timeout = window.setTimeout(() => saveContent(), 900);

        return () => window.clearTimeout(timeout);
    }, [conflictDocument, isDirty, markdown, saveContent]);

    function handleMarkdownChange(nextMarkdown: string): void {
        setMarkdown(nextMarkdown);
        setIsDirty(true);
        setConflictDocument(null);
    }

    function handleCreateDocument(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        if (newTitle.trim() === '') return;

        router.post(route('docs.store', { project: project.id }), { title: newTitle.trim() });
    }

    function handleRename(): void {
        if (title.trim() === '' || title === currentDocument.title) return;

        router.patch(route('docs.update', { project: project.id, document: currentDocument.id }), { title: title.trim() });
    }

    function handleDelete(): void {
        if (documentList.length <= 1 || !window.confirm(`Delete "${currentDocument.title}"?`)) return;

        router.delete(route('docs.destroy', { project: project.id, document: currentDocument.id }));
    }

    async function uploadImage(file: File): Promise<string | null> {
        const body = new FormData();
        body.append('file', file);

        const response = await fetch(route('docs.assets.store', { project: project.id, document: currentDocument.id }), {
            method: 'POST',
            headers: formHeaders(),
            body,
        });

        return handleUploadResponse(response);
    }

    function handleSelectionChange(selection: { from: number; to: number }): void {
        const now = Date.now();
        if (now - lastWhisperedAt.current < 250) return;

        lastWhisperedAt.current = now;
        (channel() as PresenceChannel).whisper('docsSelection', selectionPayload(selection, auth.user));
    }

    return (
        <div className="grid h-full min-h-[calc(100vh-5rem)] grid-cols-1 overflow-hidden bg-background lg:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="flex max-h-80 min-h-0 flex-col border-r border-border bg-sidebar/50 lg:max-h-none">
                <div className="border-b border-border p-4">
                    <p className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <FilePlus2 className="h-4 w-4" />
                        Documents
                    </p>
                    <form className="flex gap-2" onSubmit={handleCreateDocument}>
                        <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="New document" />
                        <Button size="icon" type="submit" title="Create document">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
                <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    {documentList.map((document) => (
                        <Link
                            key={document.id}
                            className={cn(
                                'mb-1 block truncate rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                                document.id === currentDocument.id && 'bg-accent text-accent-foreground',
                            )}
                            href={route('docs.show', { project: project.id, document: document.id })}
                        >
                            {document.title}
                        </Link>
                    ))}
                </nav>
                <div className="border-t border-border p-3">
                    <CollaboratorList collaborators={collaborators.filter((user) => user.id !== auth.user.id)} />
                </div>
            </aside>

            <main className="flex min-w-0 flex-col overflow-hidden">
                <header className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <Input
                        aria-label="Document title"
                        className="h-10 border-0 px-0 text-xl shadow-none focus-visible:ring-0"
                        value={title}
                        onBlur={handleRename}
                        onChange={(event) => setTitle(event.target.value)}
                    />
                    <Button size="icon" variant="ghost" onClick={handleDelete} disabled={documentList.length <= 1} title="Delete document">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </header>
                {conflictDocument && <ConflictBanner document={conflictDocument} onUseLatest={() => applyDocument(conflictDocument)} />}
                <DocumentEditor
                    document={currentDocument}
                    markdown={markdown}
                    onMarkdownChange={handleMarkdownChange}
                    onSave={saveContent}
                    onSelectionChange={handleSelectionChange}
                    onUploadImage={uploadImage}
                    remoteSelections={remoteSelections}
                    saveDisabled={!isDirty || status === 'Saving...'}
                    status={status}
                />
            </main>
        </div>
    );
}

function registerPresenceListeners(
    presenceChannel: PresenceChannel,
    currentUserId: number,
    setCollaborators: Dispatch<SetStateAction<CollaborationUser[]>>,
    setRemoteSelections: Dispatch<SetStateAction<RemoteCursorSelection[]>>,
): void {
    presenceChannel.here((users: CollaborationUser[]) => setCollaborators(() => users));
    presenceChannel.joining((user: CollaborationUser) => setCollaborators((users) => upsertUser(users, user)));
    presenceChannel.leaving((user: CollaborationUser) => {
        setCollaborators((users) => users.filter((item) => item.id !== user.id));
        setRemoteSelections((selections) => selections.filter((item) => item.userId !== user.id));
    });
    presenceChannel.listenForWhisper('docsSelection', (payload: SelectionWhisperPayload) => {
        if (payload.userId === currentUserId) return;

        setRemoteSelections((selections) => upsertSelection(selections, payload));
    });
}

function selectionPayload(selection: { from: number; to: number }, user: SharedData['auth']['user']): SelectionWhisperPayload {
    return {
        color: colorForUser(user.id),
        from: selection.from,
        name: user.name,
        to: selection.to,
        userId: user.id,
    };
}

function sendSaveRequest(projectId: string, documentId: string, markdown: string, version: number): Promise<Response> {
    return fetch(route('docs.content.update', { project: projectId, document: documentId }), {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({ markdown, base_version: version }),
    });
}

async function handleUploadResponse(response: Response): Promise<string | null> {
    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as { url?: string };

    return payload.url ?? null;
}

export function colorForUser(userId: number): string {
    const colors = ['#ef4444', '#14b8a6', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16'];

    return colors[userId % colors.length];
}

function upsertUser(users: CollaborationUser[], user: CollaborationUser): CollaborationUser[] {
    return users.some((item) => item.id === user.id) ? users.map((item) => (item.id === user.id ? user : item)) : [...users, user];
}

function upsertSelection(selections: RemoteCursorSelection[], payload: SelectionWhisperPayload): RemoteCursorSelection[] {
    const selection = { ...payload };

    return selections.some((item) => item.userId === payload.userId)
        ? selections.map((item) => (item.userId === payload.userId ? selection : item))
        : [...selections, selection];
}

function replaceDocument(documents: ProjectDocument[], document: ProjectDocument): ProjectDocument[] {
    return documents.map((item) => (item.id === document.id ? document : item));
}

function CollaboratorList({ collaborators }: { collaborators: CollaborationUser[] }) {
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UsersRound className="h-4 w-4" />
            <span>{collaborators.length === 0 ? 'Only you here' : collaborators.map((user) => user.name).join(', ')}</span>
        </div>
    );
}

function ConflictBanner({ document, onUseLatest }: { document: ProjectDocument; onUseLatest: () => void }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-900 dark:text-yellow-200">
            <span>Remote changes were saved for version {document.version} while you were editing.</span>
            <Button size="sm" variant="outline" onClick={onUseLatest}>
                Use latest
            </Button>
        </div>
    );
}
