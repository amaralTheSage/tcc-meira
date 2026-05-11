import type { BoardOperation } from '@/types/models';
import type { Connection, Node, NodeChange } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import {
    TRACEBOARD_TOUCH_LOCK_TTL_MS,
    createTraceboardTouchLockPayload,
    decorateTraceboardNodesWithTouchLocks,
    filterRemoteLockedTraceboardNodeChanges,
    isTraceboardConnectionRemoteLocked,
    isTraceboardNodeRemoteLocked,
    isTraceboardOperationRemoteLocked,
    receiveTraceboardNodeTouchStarted,
    releaseTraceboardNodeTouchLock,
    removeStaleTraceboardNodeTouchLocks,
    traceboardTouchLockUserIds,
    type TraceboardNodeTouchLock,
} from './traceboard-node-touch-locks';

describe('Traceboard node touch lock helpers', () => {
    it('starts, releases, and expires locks by owner', () => {
        const payload = remoteLock({ expiresAt: 8000 });
        const locks = receiveTraceboardNodeTouchStarted({}, payload, 1000);

        expect(locks['task-1']).toEqual(payload);
        expect(releaseTraceboardNodeTouchLock(locks, { nodeId: 'task-1', userId: 9 })).toEqual(locks);
        expect(releaseTraceboardNodeTouchLock(locks, { nodeId: 'task-1', userId: 8 })['task-1']).toBeUndefined();
        expect(removeStaleTraceboardNodeTouchLocks(locks, 8000)['task-1']).toBeUndefined();
    });

    it('builds a local heartbeat payload with an eight-second expiry', () => {
        const payload = createTraceboardTouchLockPayload(
            'note-1',
            'Note',
            { email: 'me@example.com', email_verified_at: null, id: 7, name: 'Me' },
            2000,
        );

        expect(payload).toMatchObject({ expiresAt: 2000 + TRACEBOARD_TOUCH_LOCK_TTL_MS, nodeId: 'note-1', type: 'Note' });
        expect(isTraceboardNodeRemoteLocked(payload, 7)).toBe(false);
        expect(isTraceboardNodeRemoteLocked(payload, 8)).toBe(true);
    });

    it('decorates remote locks as non-draggable and local locks as editable', () => {
        const nodes = [traceboardNode('task-1'), traceboardNode('note-1', 'Note')];
        const locks = { 'note-1': remoteLock({ nodeId: 'note-1', type: 'Note' }), 'task-1': localLock() };

        const decorated = decorateTraceboardNodesWithTouchLocks(nodes, locks, 7, {});

        expect(decorated[0].draggable).toBeUndefined();
        expect(decorated[0].data.touchLockIsLocal).toBe(true);
        expect(decorated[1].draggable).toBe(false);
        expect(decorated[1].connectable).toBe(false);
        expect(decorated[1].className).toContain('nopan');
        expect(decorated[1].data.touchLockIsRemote).toBe(true);
    });

    it('filters movement and delete changes for remote-locked nodes', () => {
        const changes: NodeChange<Node>[] = [
            { id: 'task-1', position: { x: 1, y: 2 }, type: 'position' },
            { id: 'task-1', selected: true, type: 'select' },
            { id: 'note-1', type: 'remove' },
        ];
        const locks = { 'task-1': remoteLock(), 'note-1': remoteLock({ nodeId: 'note-1', type: 'Note' }) };

        expect(filterRemoteLockedTraceboardNodeChanges(changes, locks, 7)).toEqual([{ id: 'task-1', selected: true, type: 'select' }]);
    });

    it('blocks connections and queued operations that touch remote locks', () => {
        const locks = { 'task-1': remoteLock(), 'note-1': remoteLock({ nodeId: 'note-1', type: 'Note' }) };
        const connection: Connection = { source: 'task-1', sourceHandle: null, target: 'open-node', targetHandle: null };
        const updateOperation: BoardOperation = { task: { id: 'note-1', title: 'Blocked' }, type: 'update_note' };
        const connectOperation: BoardOperation = { connection: { source_id: 'open-node', target_id: 'task-1' }, task: {}, type: 'connect' };

        expect(isTraceboardConnectionRemoteLocked(connection, locks, 7)).toBe(true);
        expect(isTraceboardOperationRemoteLocked(updateOperation, locks, 7)).toBe(true);
        expect(isTraceboardOperationRemoteLocked(connectOperation, locks, 7)).toBe(true);
    });

    it('reports users with active Traceboard touch locks', () => {
        const locks = { 'task-1': localLock(), 'note-1': remoteLock({ nodeId: 'note-1', type: 'Note' }) };

        expect(traceboardTouchLockUserIds(locks)).toEqual(new Set([7, 8]));
    });
});

function traceboardNode(id: string, type: 'Task' | 'Note' = 'Task'): Node {
    return { data: {}, id, position: { x: 0, y: 0 }, type };
}

function localLock(): TraceboardNodeTouchLock {
    return remoteLock({ user: { id: 7, name: 'Me' } });
}

function remoteLock(overrides: Partial<TraceboardNodeTouchLock> = {}): TraceboardNodeTouchLock {
    return {
        expiresAt: 8000,
        nodeId: 'task-1',
        type: 'Task',
        user: { avatar: '/avatar.png', id: 8, name: 'Remote User' },
        ...overrides,
    };
}
