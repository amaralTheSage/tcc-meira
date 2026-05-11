import type { BoardOperation } from '@/types/models';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useProjectUndoFlusher } from '../project-undo/project-undo-provider';

const DEBOUNCE_DELAY = 200;

type OperationTask = NonNullable<BoardOperation['task']>;
type OperationQueueRef = MutableRefObject<BoardOperation[]>;
type SetBoardOperations = Dispatch<SetStateAction<BoardOperation[]>>;
type OperationFinish = () => void;
type OperationSender = (projectId: string, operation: BoardOperation, onFinish?: OperationFinish) => void;
type DebouncedOperationSync = () => void;

interface ScrollOptions {
    preserveScroll: true;
    onError: () => void;
    onFinish?: OperationFinish;
}

interface BoardOperationQueue {
    queueOperation: (operation: BoardOperation) => void;
    removePendingOpsForTask: (taskId: string) => void;
}

const boardOperationSenders: Record<string, OperationSender> = {
    create_note: storeNote,
    delete_note: destroyNote,
    update_note: updateNote,
    create_task: storeTask,
    update: updateTask,
    delete: destroyTask,
    connect: connectTasks,
    disconnect: disconnectTasks,
};

/**
 * Keeps traceboard writes in a debounced queue so drag and edit bursts do not
 * send a request for every pointer event.
 *
 * @example
 * const { queueOperation } = useBoardOperationQueue(project.id);
 * queueOperation({ type: 'update', task: { id: task.id, title } });
 */
export function useBoardOperationQueue(projectId: string): BoardOperationQueue {
    const [pendingOps, setPendingOps] = useState<BoardOperation[]>([]);
    const opsRef = useRef<BoardOperation[]>(pendingOps);
    const syncOps = useDebouncedOperationSync(projectId, opsRef, setPendingOps);
    const flushOps = useCallback(() => flushQueuedOperations(projectId, opsRef, setPendingOps), [projectId]);

    useSyncedOperationRef(opsRef, pendingOps);
    useUnsavedOperationWarning(pendingOps);
    useProjectUndoFlusher(flushOps);

    const queueOperation = useCallback(
        (operation: BoardOperation): void => {
            const nextOps = [...opsRef.current, operation];
            opsRef.current = nextOps;
            setPendingOps(nextOps);
            syncOps();
        },
        [opsRef, syncOps],
    );

    const removePendingOpsForTask = useCallback(
        (taskId: string): void => {
            const nextOps = opsRef.current.filter((operation) => operation.task?.id !== taskId);
            opsRef.current = nextOps;
            setPendingOps(nextOps);
        },
        [opsRef],
    );

    return { queueOperation, removePendingOpsForTask };
}

function useDebouncedOperationSync(projectId: string, opsRef: OperationQueueRef, setPendingOps: SetBoardOperations): DebouncedOperationSync {
    return useRef(debounce(() => syncQueuedOperations(projectId, opsRef, setPendingOps), DEBOUNCE_DELAY)).current;
}

function useSyncedOperationRef(opsRef: OperationQueueRef, pendingOps: BoardOperation[]): void {
    useEffect(() => {
        opsRef.current = pendingOps;
    }, [opsRef, pendingOps]);
}

function useUnsavedOperationWarning(pendingOps: BoardOperation[]): void {
    useEffect(() => {
        if (pendingOps.length === 0) return;

        window.addEventListener('beforeunload', preventUnloadWithPendingOps, { capture: true });
        return () => window.removeEventListener('beforeunload', preventUnloadWithPendingOps, { capture: true });
    }, [pendingOps]);
}

function preventUnloadWithPendingOps(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '';
}

function syncQueuedOperations(projectId: string, opsRef: OperationQueueRef, setPendingOps: SetBoardOperations): void {
    if (opsRef.current.length === 0) return;

    opsRef.current.forEach((operation) => sendBoardOperation(projectId, operation));
    opsRef.current = [];
    setPendingOps([]);
}

function flushQueuedOperations(projectId: string, opsRef: OperationQueueRef, setPendingOps: SetBoardOperations): Promise<void> {
    const operations = [...opsRef.current];
    if (operations.length === 0) return Promise.resolve();

    opsRef.current = [];
    setPendingOps([]);

    return new Promise((resolve) => sendOperationsAndResolve(projectId, operations, resolve));
}

function sendOperationsAndResolve(projectId: string, operations: BoardOperation[], resolve: () => void): void {
    let remaining = operations.length;
    const onFinish = () => {
        remaining -= 1;
        if (remaining === 0) resolve();
    };

    operations.forEach((operation) => sendBoardOperation(projectId, operation, onFinish));
}

function sendBoardOperation(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const sender = boardOperationSenders[operation.type.toLowerCase()];
    if (!sender) {
        onFinish?.();
        return;
    }

    sender(projectId, operation, onFinish);
}

function operationTask(operation: BoardOperation): OperationTask {
    return operation.task ?? {};
}

function storeNote(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);

    router.post(route('notes.store', { project: projectId }), { id: task.id, x: task.x, y: task.y }, scrollOptions('creating note', onFinish));
}

function destroyNote(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);
    const message = task.title ? 'deleting note' : `deleting note ${task.id}`;

    router.delete(route('notes.destroy', { project: projectId, note: task.id }), scrollOptions(message, onFinish));
}

function updateNote(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);
    const message = task.text ? 'updating note' : `updating note ${task.id}`;

    router.patch(route('notes.update', { project: projectId, note: task.id }), notePayload(task), scrollOptions(message, onFinish));
}

function storeTask(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);

    router.post(
        route('tasks.store', { project: projectId }),
        { id: task.id, x: task.x, y: task.y, position: 0 },
        scrollOptions('creating task', onFinish),
    );
}

function updateTask(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);
    const message = task.title ? `updating task ${task.title}` : `updating task ${task.id}`;

    router.patch(route('tasks.update', { project: projectId, task: task.id }), taskPayload(task), scrollOptions(message, onFinish));
}

function destroyTask(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    const task = operationTask(operation);
    const message = task.title ? `deleting task ${task.title}` : `deleting task ${task.id}`;

    router.delete(route('tasks.destroy', { project: projectId, task_id: task.id }), scrollOptions(message, onFinish));
}

function connectTasks(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    router.post(route('tasks.connect', { project: projectId }), connectionPayload(operation), { onFinish });
}

function disconnectTasks(projectId: string, operation: BoardOperation, onFinish?: OperationFinish): void {
    router.post(route('tasks.disconnect', { project: projectId }), connectionPayload(operation), { onFinish });
}

function notePayload(task: OperationTask): Record<string, string | number | undefined> {
    return { text: task.text, x: task.x, y: task.y };
}

function taskPayload(task: OperationTask): Record<string, string | number | undefined> {
    return { title: task.title, x: task.x, y: task.y };
}

function connectionPayload(operation: BoardOperation): Record<string, string | null | undefined> {
    return {
        source_id: operation.connection?.source_id,
        target_id: operation.connection?.target_id,
    };
}

function scrollOptions(action: string, onFinish?: OperationFinish): ScrollOptions {
    return {
        preserveScroll: true,
        onError: () => toast.error(`An error occurred when ${action}.`),
        onFinish,
    };
}
