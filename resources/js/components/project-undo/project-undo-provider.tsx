import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SharedData } from '@/types';
import type { Project } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Undo2 } from 'lucide-react';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';

type ProjectUndoFlusher = () => Promise<void> | void;

interface ProjectUndoContextValue {
    canUndo: boolean;
    label?: string;
    registerFlusher: (flusher: ProjectUndoFlusher) => () => void;
    undo: () => Promise<void>;
}

interface ProjectBoardRefreshedPayload {
    projectId: string;
    userId: number;
}

const ProjectUndoContext = createContext<ProjectUndoContextValue | null>(null);

export function ProjectUndoProvider({ children, project }: { children: ReactNode; project: Project }) {
    const flushers = useRef(new Set<ProjectUndoFlusher>());
    const { auth, projectUndo } = usePage<SharedData>().props;

    const registerFlusher = useCallback((flusher: ProjectUndoFlusher): (() => void) => {
        flushers.current.add(flusher);
        return () => flushers.current.delete(flusher);
    }, []);

    const undo = useCallback(async (): Promise<void> => {
        if (!projectUndo.can_undo) return;

        await flushPendingWrites(flushers.current);
        router.post(route('project.undo', { project: project.id }), {}, undoVisitOptions(projectUndo.label));
    }, [project.id, projectUndo.can_undo, projectUndo.label]);

    useProjectUndoShortcut(undo);
    useProjectBoardRefresh(project.id, auth.user.id);

    const value = useMemo(
        () => ({ canUndo: projectUndo.can_undo, label: projectUndo.label, registerFlusher, undo }),
        [projectUndo.can_undo, projectUndo.label, registerFlusher, undo],
    );

    return <ProjectUndoContext.Provider value={value}>{children}</ProjectUndoContext.Provider>;
}

export function ProjectUndoButton() {
    const undo = useProjectUndo();
    const label = undo.label ? `Undo ${undo.label}` : 'Undo';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={label} disabled={!undo.canUndo} onClick={() => void undo.undo()}>
                    <Undo2 />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export function useProjectUndoFlusher(flusher: ProjectUndoFlusher): void {
    const undo = useContext(ProjectUndoContext);

    useEffect(() => {
        if (!undo) return;

        return undo.registerFlusher(flusher);
    }, [flusher, undo]);
}

function useProjectUndo(): ProjectUndoContextValue {
    const undo = useContext(ProjectUndoContext);

    return (
        undo ?? {
            canUndo: false,
            registerFlusher: () => () => undefined,
            undo: async () => undefined,
        }
    );
}

function useProjectUndoShortcut(undo: () => Promise<void>): void {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent): void => {
            if (!isUndoShortcut(event) || targetKeepsNativeUndo(event.target)) return;
            event.preventDefault();
            void undo();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo]);
}

function useProjectBoardRefresh(projectId: string, currentUserId: number): void {
    useEcho<ProjectBoardRefreshedPayload>('project-board', 'ProjectBoardRefreshed', (payload) => {
        if (payload.projectId !== projectId || payload.userId === currentUserId) return;
        remountProjectPage();
    });
}

async function flushPendingWrites(flushers: Set<ProjectUndoFlusher>): Promise<void> {
    for (const flusher of flushers) {
        await flusher();
    }
}

function undoVisitOptions(label?: string): Record<string, unknown> {
    return {
        preserveScroll: true,
        preserveState: false,
        onError: () => toast.error('Unable to undo the latest action.'),
        onSuccess: () => toast.success(label ? `Undid ${label}.` : 'Undone.'),
    };
}

function remountProjectPage(): void {
    router.visit(window.location.href, {
        preserveScroll: true,
        preserveState: false,
        replace: true,
    });
}

function isUndoShortcut(event: KeyboardEvent): boolean {
    return (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
}

function targetKeepsNativeUndo(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;

    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
