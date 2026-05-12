import type { QueueOperation } from '@/types/models';

export const TRACEBOARD_NODE_DELETE_KEY_CODES = ['Backspace', 'Delete'];

export interface TraceboardNodeDeleteCandidate {
    id: string;
    type?: string;
}

type RemovePendingTraceboardOperations = (taskId: string) => void;

/**
 * Queues persisted deletes for Traceboard task and note nodes.
 *
 * @example
 * queueTraceboardNodeDeletes([{ id: 'task-1', type: 'Task' }], removePendingOps, queueOperation);
 */
export function queueTraceboardNodeDeletes(
    nodes: TraceboardNodeDeleteCandidate[],
    removePendingOpsForTask: RemovePendingTraceboardOperations,
    queueOperation: QueueOperation,
): void {
    nodes.forEach((node) => {
        if (node.type !== 'Task' && node.type !== 'Note') return;

        removePendingOpsForTask(node.id);
        queueOperation({ type: node.type === 'Task' ? 'delete' : 'delete_note', task: { id: node.id } });
    });
}
