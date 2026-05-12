import { describe, expect, it, vi } from 'vitest';
import { queueTraceboardNodeDeletes, TRACEBOARD_NODE_DELETE_KEY_CODES } from './traceboard-node-deletes';

describe('queueTraceboardNodeDeletes', () => {
    it('enables selected-node deletes from Backspace and Delete keys', () => {
        expect(TRACEBOARD_NODE_DELETE_KEY_CODES).toEqual(['Backspace', 'Delete']);
    });

    it('queues persisted deletes for task and note nodes', () => {
        const queueOperation = vi.fn();
        const removePendingOpsForTask = vi.fn();

        queueTraceboardNodeDeletes(
            [
                { id: 'task-1', type: 'Task' },
                { id: 'note-1', type: 'Note' },
            ],
            removePendingOpsForTask,
            queueOperation,
        );

        expect(removePendingOpsForTask).toHaveBeenCalledWith('task-1');
        expect(removePendingOpsForTask).toHaveBeenCalledWith('note-1');
        expect(queueOperation).toHaveBeenCalledWith({ type: 'delete', task: { id: 'task-1' } });
        expect(queueOperation).toHaveBeenCalledWith({ type: 'delete_note', task: { id: 'note-1' } });
    });

    it('ignores remote cursor and unknown node types', () => {
        const queueOperation = vi.fn();
        const removePendingOpsForTask = vi.fn();

        queueTraceboardNodeDeletes([{ id: 'cursor-1', type: 'UserCursor' }, { id: 'unknown-1' }], removePendingOpsForTask, queueOperation);

        expect(removePendingOpsForTask).not.toHaveBeenCalled();
        expect(queueOperation).not.toHaveBeenCalled();
    });
});
