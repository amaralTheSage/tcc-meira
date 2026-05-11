import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS,
    TRACEBOARD_LIVE_UPDATE_INTERVAL_MS,
    TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
    advanceRemoteCursorAnimations,
    createRemoteCursorNodes,
    easeRemoteCursorProgress,
    filterRemoteCursorNodesForUnlockedUsers,
    hasMovingRemoteCursors,
    interpolateRemoteCursorPoint,
    receiveRemoteCursorTarget,
    remoteTraceboardCursorColor,
    remoteTraceboardCursorNodeId,
    removeStaleRemoteCursors,
    type RemoteCursorPoint,
    type TraceboardCursorWhisperPayload,
} from './cursor-smoothing';
import { useSmoothedTraceboardCursors } from './use-smoothed-traceboard-cursors';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('easeRemoteCursorProgress', () => {
    it('clamps progress below 0 and above 1', () => {
        expect(easeRemoteCursorProgress(-0.5)).toBe(0);
        expect(easeRemoteCursorProgress(1.5)).toBe(1);
    });

    it('uses smoothstep progress for natural one-second motion', () => {
        expect(TRACEBOARD_LIVE_UPDATE_INTERVAL_MS).toBe(1000);
        expect(easeRemoteCursorProgress(0.25)).toBe(0.15625);
        expect(easeRemoteCursorProgress(0.5)).toBe(0.5);
        expect(easeRemoteCursorProgress(0.75)).toBe(0.84375);
    });
});

describe('interpolateRemoteCursorPoint', () => {
    it('interpolates from one point to another with eased progress', () => {
        const startPoint: RemoteCursorPoint = { x: 0, y: 10 };
        const targetPoint: RemoteCursorPoint = { x: 80, y: 50 };
        const easedProgress = easeRemoteCursorProgress(0.5);

        expect(interpolateRemoteCursorPoint(startPoint, targetPoint, easedProgress)).toEqual({ x: 40, y: 30 });
    });
});

describe('remote Traceboard cursor animation state', () => {
    it('creates the first cursor at the target without animating from origin', () => {
        const cursors = receiveRemoteCursorTarget({}, { id: 7, x: 120, y: 240 }, 1000);

        expect(cursors[7].renderedPoint).toEqual({ x: 120, y: 240 });
        expect(cursors[7].startPoint).toEqual({ x: 120, y: 240 });
        expect(cursors[7].targetPoint).toEqual({ x: 120, y: 240 });
        expect(hasMovingRemoteCursors(cursors, 1000)).toBe(false);
    });

    it('retargets mid-animation from the rendered point', () => {
        const firstTarget = receiveRemoteCursorTarget({}, { id: 7, x: 0, y: 0 }, 0);
        const secondTarget = receiveRemoteCursorTarget(firstTarget, { id: 7, x: 100, y: 0 }, 0);
        const renderedMidAnimation = advanceRemoteCursorAnimations(secondTarget, 500);

        const retargeted = receiveRemoteCursorTarget(renderedMidAnimation, { id: 7, x: 200, y: 0 }, 500);

        expect(retargeted[7].startPoint.x).toBeCloseTo(50);
        expect(retargeted[7].targetPoint).toEqual({ x: 200, y: 0 });
        expect(hasMovingRemoteCursors(retargeted, 500)).toBe(true);
    });

    it('removes stale cursors after the inactivity threshold', () => {
        const cursors = receiveRemoteCursorTarget({}, { id: 7, x: 10, y: 20 }, 1000);
        const active = removeStaleRemoteCursors(cursors, 1000 + TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS - 1, TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS);
        const stale = removeStaleRemoteCursors(cursors, 1000 + TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS, TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS);

        expect(active[7]).toBeDefined();
        expect(stale[7]).toBeUndefined();
    });

    it('creates collision-free React Flow cursor node ids', () => {
        const cursors = receiveRemoteCursorTarget({}, { id: 7, x: 10, y: 20 }, 1000);
        const nodes = createRemoteCursorNodes(cursors);

        expect(remoteTraceboardCursorNodeId(7)).toBe('remote-cursor:7');
        expect(nodes[0]).toMatchObject({
            data: { color: remoteTraceboardCursorColor(7), userId: 7 },
            draggable: false,
            height: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
            id: 'remote-cursor:7',
            initialHeight: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
            initialWidth: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
            measured: {
                height: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
                width: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
            },
            position: { x: 10, y: 20 },
            selectable: false,
            style: { pointerEvents: 'none' },
            type: 'UserCursor',
            width: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
        });
    });

    it('hides cursor nodes for users touching Traceboard cards', () => {
        const cursors = {
            ...receiveRemoteCursorTarget({}, { id: 7, x: 10, y: 20 }, 1000),
            ...receiveRemoteCursorTarget({}, { id: 8, x: 30, y: 40 }, 1000),
        };
        const nodes = createRemoteCursorNodes(cursors);

        expect(filterRemoteCursorNodesForUnlockedUsers(nodes, new Set([7]))).toEqual([
            expect.objectContaining({ data: expect.objectContaining({ userId: 8 }) }),
        ]);
    });

    it('derives stable visible cursor colors from user ids', () => {
        expect(remoteTraceboardCursorColor(7)).toBe(remoteTraceboardCursorColor(7));
        expect(remoteTraceboardCursorColor(7)).not.toBe('#FFFFFF');
        expect(remoteTraceboardCursorColor(-7)).toBe(remoteTraceboardCursorColor(7));
    });
});

describe('useSmoothedTraceboardCursors', () => {
    it('renders the first cursor immediately and retargets later cursors', () => {
        const channel = new FakeTraceboardCursorWhisperChannel();
        const { result, unmount } = renderHook(() => useSmoothedTraceboardCursors(() => channel));

        act(() => channel.emitCursorMoved({ id: 7, x: 10, y: 20 }));
        expect(result.current[0].position).toEqual({ x: 10, y: 20 });

        act(() => channel.emitCursorMoved({ id: 7, x: 40, y: 20 }));
        expect(result.current[0].position).toEqual({ x: 10, y: 20 });

        unmount();
    });

    it('keeps animating cursors through a single ref-driven frame loop', () => {
        vi.spyOn(performance, 'now').mockReturnValue(0);
        const animationFrames = mockAnimationFrames();
        const channel = new FakeTraceboardCursorWhisperChannel();
        const { result, unmount } = renderHook(() => useSmoothedTraceboardCursors(() => channel));

        act(() => channel.emitCursorMoved({ id: 7, x: 0, y: 0 }));
        act(() => channel.emitCursorMoved({ id: 7, x: 100, y: 0 }));
        expect(animationFrames.pending()).toBe(1);

        act(() => animationFrames.runNext(500));
        expect(result.current[0].position.x).toBeCloseTo(50);
        expect(animationFrames.pending()).toBe(1);

        act(() => animationFrames.runNext(1000));
        expect(result.current[0].position).toEqual({ x: 100, y: 0 });
        expect(animationFrames.pending()).toBe(0);

        unmount();
    });

    it('cleans up the Echo whisper listener on unmount', () => {
        const channel = new FakeTraceboardCursorWhisperChannel();
        const { unmount } = renderHook(() => useSmoothedTraceboardCursors(() => channel));

        expect(channel.listenForWhisper).toHaveBeenCalledWith('cursorMoved', expect.any(Function));

        unmount();

        expect(channel.stopListeningForWhisper).toHaveBeenCalledWith('cursorMoved', channel.cursorMovedCallback);
    });
});

class FakeTraceboardCursorWhisperChannel {
    cursorMovedCallback: ((payload: TraceboardCursorWhisperPayload) => void) | null = null;

    listenForWhisper = vi.fn((event: string, callback: (payload: TraceboardCursorWhisperPayload) => void): void => {
        if (event === 'cursorMoved') {
            this.cursorMovedCallback = callback;
        }
    });

    stopListeningForWhisper = vi.fn((_event: string, _callback: (payload: TraceboardCursorWhisperPayload) => void): void => {});

    emitCursorMoved(payload: TraceboardCursorWhisperPayload): void {
        this.cursorMovedCallback?.(payload);
    }
}

function mockAnimationFrames(): { pending: () => number; runNext: (timestamp: number) => void } {
    const callbacks: FrameRequestCallback[] = [];

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback): number => callbacks.push(callback));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((frameId: number): void => {
        callbacks.splice(frameId - 1, 1);
    });

    return {
        pending: () => callbacks.length,
        runNext: (timestamp: number): void => {
            callbacks.shift()?.(timestamp);
        },
    };
}
