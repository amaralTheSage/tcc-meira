import type { BoardOperation } from '@/types/models';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEBOUNCE_DELAY = 200;

type OperationTask = NonNullable<BoardOperation['task']>;
type OperationQueueRef = MutableRefObject<BoardOperation[]>;
type SetBoardOperations = Dispatch<SetStateAction<BoardOperation[]>>;
type OperationSender = (projectId: string, operation: BoardOperation) => void;
type DebouncedOperationSync = () => void;

interface ScrollOptions {
    preserveScroll: true;
    onError: () => void;
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

    useSyncedOperationRef(opsRef, pendingOps);
    useUnsavedOperationWarning(pendingOps);

    const queueOperation = useCallback(
        (operation: BoardOperation): void => {
            setPendingOps((ops) => [...ops, operation]);
            syncOps();
        },
        [syncOps],
    );

    const removePendingOpsForTask = useCallback((taskId: string): void => {
        setPendingOps((ops) => ops.filter((operation) => operation.task?.id !== taskId));
    }, []);

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
    setPendingOps([]);
}

function sendBoardOperation(projectId: string, operation: BoardOperation): void {
    const sender = boardOperationSenders[operation.type.toLowerCase()];
    if (!sender) return;

    sender(projectId, operation);
}

function operationTask(operation: BoardOperation): OperationTask {
    return operation.task ?? {};
}

function storeNote(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);

    router.post(route('notes.store', { project: projectId }), { id: task.id, x: task.x, y: task.y }, scrollOptions('creating note'));
}

function destroyNote(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);
    const message = task.title ? 'deleting note' : `deleting note ${task.id}`;

    router.delete(route('notes.destroy', { project: projectId, note: task.id }), scrollOptions(message));
}

function updateNote(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);
    const message = task.text ? 'updating note' : `updating note ${task.id}`;

    router.patch(route('notes.update', { project: projectId, note: task.id }), notePayload(task), scrollOptions(message));
}

function storeTask(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);

    router.post(route('tasks.store', { project: projectId }), { id: task.id, x: task.x, y: task.y, position: 0 }, scrollOptions('creating task'));
}

function updateTask(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);
    const message = task.title ? `updating task ${task.title}` : `updating task ${task.id}`;

    router.patch(route('tasks.update', { project: projectId, task: task.id }), taskPayload(task), scrollOptions(message));
}

function destroyTask(projectId: string, operation: BoardOperation): void {
    const task = operationTask(operation);
    const message = task.title ? `deleting task ${task.title}` : `deleting task ${task.id}`;

    router.delete(route('tasks.destroy', { project: projectId, task_id: task.id }), scrollOptions(message));
}

function connectTasks(projectId: string, operation: BoardOperation): void {
    router.post(route('tasks.connect', { project: projectId }), connectionPayload(operation));
}

function disconnectTasks(projectId: string, operation: BoardOperation): void {
    router.post(route('tasks.disconnect', { project: projectId }), connectionPayload(operation));
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

function scrollOptions(action: string): ScrollOptions {
    return {
        preserveScroll: true,
        onError: () => toast.error(`An error occurred when ${action}.`),
    };
}
