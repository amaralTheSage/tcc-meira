import { mockRouter } from '@/test/inertia';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBoardOperationQueue } from './use-board-operation-queue';

describe('useBoardOperationQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces task and note writes into Inertia requests', async () => {
        const { result } = renderHook(() => useBoardOperationQueue('project-1'));

        act(() => {
            result.current.queueOperation({ task: { id: 'task-1', title: 'Renamed' }, type: 'update' });
            result.current.queueOperation({ task: { id: 'note-1', text: 'Remember this' }, type: 'update_note' });
        });

        await act(async () => undefined);

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(mockRouter.patch).toHaveBeenCalledWith(
            '/project-1/update-task/task-1',
            { title: 'Renamed', x: undefined, y: undefined },
            expect.objectContaining({ preserveScroll: true }),
        );
        expect(mockRouter.patch).toHaveBeenCalledWith(
            '/notes.update',
            { text: 'Remember this', x: undefined, y: undefined },
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('drops queued operations for a task before the debounce flushes', () => {
        const { result } = renderHook(() => useBoardOperationQueue('project-1'));

        act(() => {
            result.current.queueOperation({ task: { id: 'task-1', title: 'Queued' }, type: 'update' });
            result.current.removePendingOpsForTask('task-1');
            vi.advanceTimersByTime(250);
        });

        expect(mockRouter.patch).not.toHaveBeenCalled();
    });
});
