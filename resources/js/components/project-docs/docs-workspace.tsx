import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formHeaders, jsonHeaders } from '@/lib/docs-http';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import type { Project, ProjectDocument } from '@/types/models';
import { Link, router, usePage } from '@inertiajs/react';
import { useEchoPresence } from '@laravel/echo-react';
import { Plus, Trash2, UsersRound } from 'lucide-react';
import {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ComponentProps,
    type Dispatch,
    type ReactElement,
    type SetStateAction,
} from 'react';
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

interface CreateDocumentDialogProps {
    newTitle: string;
    onNewTitleChange: (title: string) => void;
    onOpenChange: (open: boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    open: boolean;
}

interface CreateDocumentFormProps {
    newTitle: string;
    onNewTitleChange: (title: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

interface DeleteDocumentDialogProps {
    className?: string;
    disabled: boolean;
    document: ProjectDocument;
    onConfirm: () => void;
}

interface DocumentSidebarRowProps {
    active: boolean;
    document: ProjectDocument;
    disableDelete: boolean;
    onDelete: () => void;
    onRename: () => void;
    onTitleChange: (title: string) => void;
    projectId: string;
    title: string;
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
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

    const handleRemoteSave = useCallback(
        (payload: DocumentSavedPayload) => {
            if (payload.document.id !== currentDocument.id || payload.document.version <= version) return;
            if (isDirty && payload.document.markdown !== latestMarkdown.current) {
                setConflictDocument(payload.document);
                setStatus('Conflict');
                return;
            }

            applyDocument(payload.document);
        },
        [applyDocument, currentDocument.id, isDirty, version],
    );

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
        if (!isDirty || conflictDocument || status === 'Saving...') return;

        setStatus('Unsaved');
        const timeout = window.setTimeout(() => saveContent(), 900);

        return () => window.clearTimeout(timeout);
    }, [conflictDocument, isDirty, markdown, saveContent, status]);

    function handleMarkdownChange(nextMarkdown: string): void {
        setMarkdown(nextMarkdown);
        setIsDirty(true);
        setConflictDocument(null);
    }

    function handleCreateDocument(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        const titleToCreate = newTitle.trim();
        if (titleToCreate === '') return;

        router.post(route('docs.store', { project: project.id }), { title: titleToCreate });
        setNewTitle('');
        setIsCreateDialogOpen(false);
    }

    function handleRename(): void {
        if (title.trim() === '' || title === currentDocument.title) return;

        router.patch(route('docs.update', { project: project.id, document: currentDocument.id }), { title: title.trim() });
    }

    function handleDelete(): void {
        if (documentList.length <= 1) return;

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
                    <CreateDocumentDialog
                        newTitle={newTitle}
                        onNewTitleChange={setNewTitle}
                        onOpenChange={setIsCreateDialogOpen}
                        onSubmit={handleCreateDocument}
                        open={isCreateDialogOpen}
                    />
                </div>
                <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
                    {documentList.map((document) => (
                        <DocumentSidebarRow
                            key={document.id}
                            active={document.id === currentDocument.id}
                            disableDelete={documentList.length <= 1}
                            document={document}
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onTitleChange={setTitle}
                            projectId={project.id}
                            title={title}
                        />
                    ))}
                </nav>
                <div className="border-t border-border p-3">
                    <CollaboratorList collaborators={collaborators.filter((user) => user.id !== auth.user.id)} />
                </div>
            </aside>

            <main className="flex min-w-0 flex-col overflow-hidden">
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

function DocumentSidebarRow({
    active,
    document,
    disableDelete,
    onDelete,
    onRename,
    onTitleChange,
    projectId,
    title,
}: DocumentSidebarRowProps): ReactElement {
    if (active) {
        return (
            <div className="mb-1 flex items-center gap-1 rounded-sm bg-accent px-2 py-1.5 text-accent-foreground">
                <Input
                    aria-label="Document title"
                    className="h-8 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm font-medium shadow-none focus-visible:ring-1"
                    value={title}
                    onBlur={onRename}
                    onChange={(event) => onTitleChange(event.target.value)}
                />
                <DeleteDocumentDialog className="size-7" document={document} disabled={disableDelete} onConfirm={onDelete} />
            </div>
        );
    }

    return (
        <Link
            className="mb-1 block truncate rounded-sm px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            href={route('docs.show', { project: projectId, document: document.id })}
        >
            {document.title}
        </Link>
    );
}

function DeleteDocumentDialog({ className, disabled, document, onConfirm }: DeleteDocumentDialogProps): ReactElement {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={disabled}
                    title="Delete document"
                    aria-label={`Delete ${document.title}`}
                    className={cn('text-muted-foreground hover:bg-destructive/10 hover:text-destructive', className)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete document?</DialogTitle>
                    <DialogDescription>Delete "{document.title}"? The workspace will open the next available document.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="button" variant="destructive" onClick={onConfirm}>
                            Delete file
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateDocumentDialog({ newTitle, onNewTitleChange, onOpenChange, onSubmit, open }: CreateDocumentDialogProps): ReactElement {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <CreateDocumentButton />
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <CreateDocumentForm newTitle={newTitle} onNewTitleChange={onNewTitleChange} onSubmit={onSubmit} />
            </DialogContent>
        </Dialog>
    );
}

function CreateDocumentButton({ className, ...props }: ComponentProps<typeof Button>): ReactElement {
    return (
        <Button {...props} className={cn('w-full justify-start', className)} type="button" variant="outline">
            <Plus className="h-4 w-4" />
            New document
        </Button>
    );
}

function CreateDocumentForm({ newTitle, onNewTitleChange, onSubmit }: CreateDocumentFormProps): ReactElement {
    return (
        <form className="space-y-4" onSubmit={onSubmit}>
            <DialogHeader>
                <DialogTitle>New document</DialogTitle>
                <DialogDescription>Name the file before adding it to this project.</DialogDescription>
            </DialogHeader>
            <Input aria-label="New document title" autoFocus value={newTitle} onChange={(event) => onNewTitleChange(event.target.value)} />
            <DialogFooter>
                <Button type="submit">Create document</Button>
            </DialogFooter>
        </form>
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
