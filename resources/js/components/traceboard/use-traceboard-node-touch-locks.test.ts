import { emitEcho, whisperMock } from '@/test/echo';
import { buildUser } from '@/test/factories';
import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS,
    TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS,
    TRACEBOARD_TOUCH_LOCK_TTL_MS,
    decorateTraceboardNodesWithTouchLocks,
} from './traceboard-node-touch-locks';
import { useTraceboardNodeTouchLocks } from './use-traceboard-node-touch-locks';

describe('useTraceboardNodeTouchLocks', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('whispers local start, heartbeat, and final release only after all reasons end', () => {
        vi.useFakeTimers();
        vi.setSystemTime(1000);
        const user = buildUser({ id: 7, name: 'Current User' });
        const { result, unmount } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'pointer'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'editing'));

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchStarted', {
            expiresAt: 1000 + TRACEBOARD_TOUCH_LOCK_TTL_MS,
            nodeId: 'task-1',
            type: 'Task',
            user: { avatar: null, id: 7, name: 'Current User' },
        });
        expect(result.current.nodeTouchLocks['task-1']?.user.id).toBe(7);

        act(() => result.current.endTouchLock('task-1', 'Task', 'pointer'));
        expect(result.current.nodeTouchLocks['task-1']).toBeDefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => {
            vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS);
        });
        expect(whisperMock).toHaveBeenLastCalledWith(
            'nodeTouchStarted',
            expect.objectContaining({ expiresAt: 1000 + TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS + TRACEBOARD_TOUCH_LOCK_TTL_MS }),
        );

        act(() => result.current.endTouchLock('task-1', 'Task', 'editing'));
        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();

        unmount();
    });

    it('clears the owner drag lock immediately while delaying the remote release whisper', () => {
        vi.useFakeTimers();
        vi.setSystemTime(1000);
        const user = buildUser({ id: 7, name: 'Current User' });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        const remoteLock = result.current.nodeTouchLocks['task-1'];
        whisperMock.mockClear();

        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(remoteDecoratedTask({ 'task-1': remoteLock! }, 8).draggable).toBe(false);
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS - 1));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => vi.advanceTimersByTime(1));

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('resets a pending drag release when a new drag starts', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS / 2));
        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        whisperMock.mockClear();

        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS / 2));

        expect(result.current.nodeTouchLocks['task-1']).toBeDefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('clears the original pointer reason with the local drag release', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'pointer'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        whisperMock.mockClear();
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('ignores drag release requests when no drag reason is active', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'pointer'));
        whisperMock.mockClear();
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(result.current.nodeTouchLocks['task-1']).toBeDefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => result.current.endTouchLock('task-1', 'Task', 'pointer'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('cancels a pending remote drag release when a pointer reason starts during the delay', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'pointer'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'pointer'));
        whisperMock.mockClear();
        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(result.current.nodeTouchLocks['task-1']).toBeDefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => result.current.endTouchLock('task-1', 'Task', 'pointer'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('waits for non-drag reasons after a delayed remote drag release', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'editing'));
        whisperMock.mockClear();
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(result.current.nodeTouchLocks['task-1']).toBeDefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => result.current.endTouchLock('task-1', 'Task', 'editing'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('keeps the remote drag delay when another reason ends before the timer', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        act(() => result.current.startTouchLock('task-1', 'Task', 'editing'));
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        whisperMock.mockClear();
        act(() => result.current.endTouchLock('task-1', 'Task', 'editing'));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
        expect(whisperMock).not.toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });

        act(() => vi.advanceTimersByTime(TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS));

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('releases pending remote drag holds on unmount', () => {
        vi.useFakeTimers();
        const user = buildUser({ id: 7 });
        const { result, unmount } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => result.current.startTouchLock('task-1', 'Task', 'drag'));
        whisperMock.mockClear();
        act(() => result.current.endTouchLock('task-1', 'Task', 'drag'));
        unmount();

        expect(whisperMock).toHaveBeenCalledWith('nodeTouchEnded', { nodeId: 'task-1', userId: 7 });
    });

    it('listens for remote locks and removes them after stale cleanup', () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => {
            emitEcho('tasks', 'nodeTouchStarted', {
                expiresAt: 8000,
                nodeId: 'note-1',
                type: 'Note',
                user: { avatar: '/remote.png', id: 8, name: 'Remote User' },
            });
        });

        expect(result.current.nodeTouchLocks['note-1']?.user.id).toBe(8);

        act(() => {
            vi.setSystemTime(9000);
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.nodeTouchLocks['note-1']).toBeUndefined();
    });

    it('honors remote release whispers for the owning user', () => {
        const user = buildUser({ id: 7 });
        const { result } = renderHook(() => useTraceboardNodeTouchLocks(user));

        act(() => {
            emitEcho('tasks', 'nodeTouchStarted', {
                expiresAt: Date.now() + 8000,
                nodeId: 'task-1',
                type: 'Task',
                user: { avatar: null, id: 8, name: 'Remote User' },
            });
        });
        act(() => emitEcho('tasks', 'nodeTouchEnded', { nodeId: 'task-1', userId: 8 }));

        expect(result.current.nodeTouchLocks['task-1']).toBeUndefined();
    });
});

function remoteDecoratedTask(locks: ReturnType<typeof useTraceboardNodeTouchLocks>['nodeTouchLocks'], currentUserId: number): Node {
    return decorateTraceboardNodesWithTouchLocks([traceboardNode('task-1')], locks, currentUserId, {})[0];
}

function traceboardNode(id: string): Node {
    return { data: {}, id, position: { x: 0, y: 0 }, type: 'Task' };
}
