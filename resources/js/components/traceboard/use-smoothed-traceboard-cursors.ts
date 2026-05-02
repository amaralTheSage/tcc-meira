import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    TRACEBOARD_CURSOR_CLEANUP_INTERVAL_MS,
    TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS,
    advanceRemoteCursorAnimations,
    createRemoteCursorNodes,
    hasMovingRemoteCursors,
    receiveRemoteCursorTarget,
    removeStaleRemoteCursors,
    type RemoteCursorAnimationsByUser,
    type TraceboardCursorWhisperPayload,
    type TraceboardRemoteCursorNode,
} from './cursor-smoothing';

interface TraceboardCursorWhisperChannel {
    listenForWhisper(event: string, callback: (payload: TraceboardCursorWhisperPayload) => void): unknown;
    stopListeningForWhisper(event: string, callback: (payload: TraceboardCursorWhisperPayload) => void): unknown;
}

type UpdateRemoteCursorAnimations = (current: RemoteCursorAnimationsByUser) => RemoteCursorAnimationsByUser;

/**
 * Owns animated remote Traceboard cursor nodes outside task and note node state.
 *
 * @example
 * const remoteCursorNodes = useSmoothedTraceboardCursors(channel);
 */
export function useSmoothedTraceboardCursors(channel: () => TraceboardCursorWhisperChannel): TraceboardRemoteCursorNode[] {
    const { commitCursorAnimations, cursorAnimations } = useRemoteCursorAnimationStore();
    useTraceboardCursorWhispers(channel, commitCursorAnimations);
    useRemoteCursorAnimationFrames(cursorAnimations, commitCursorAnimations);
    useRemoteCursorCleanup(commitCursorAnimations);

    return useMemo(() => createRemoteCursorNodes(cursorAnimations), [cursorAnimations]);
}

function useRemoteCursorAnimationStore(): {
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void;
    cursorAnimations: RemoteCursorAnimationsByUser;
} {
    const [cursorAnimations, setCursorAnimations] = useState<RemoteCursorAnimationsByUser>({});
    const cursorAnimationsRef = useRef<RemoteCursorAnimationsByUser>({});

    const commitCursorAnimations = useCallback((update: UpdateRemoteCursorAnimations): void => {
        const nextAnimations = update(cursorAnimationsRef.current);
        cursorAnimationsRef.current = nextAnimations;
        setCursorAnimations(nextAnimations);
    }, []);

    return { commitCursorAnimations, cursorAnimations };
}

function useTraceboardCursorWhispers(
    channel: () => TraceboardCursorWhisperChannel,
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void,
): void {
    const receiveWhisperedCursor = useCallback(
        (payload: TraceboardCursorWhisperPayload): void => updateRemoteCursorTarget(commitCursorAnimations, payload),
        [commitCursorAnimations],
    );

    useEffect(() => {
        const cursorChannel = channel();
        cursorChannel.listenForWhisper('cursorMoved', receiveWhisperedCursor);

        return () => {
            cursorChannel.stopListeningForWhisper('cursorMoved', receiveWhisperedCursor);
        };
    }, [channel, receiveWhisperedCursor]);
}

function updateRemoteCursorTarget(
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void,
    payload: TraceboardCursorWhisperPayload,
): void {
    const nowMs = performance.now();
    commitCursorAnimations((current) => {
        const renderedCurrent = advanceRemoteCursorAnimations(current, nowMs);

        return receiveRemoteCursorTarget(renderedCurrent, payload, nowMs);
    });
}

function useRemoteCursorAnimationFrames(
    cursorAnimations: RemoteCursorAnimationsByUser,
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void,
): void {
    useEffect(() => {
        if (!hasMovingRemoteCursors(cursorAnimations, performance.now())) {
            return;
        }

        const frameId = requestTraceboardCursorFrame((timestamp: number) => {
            commitCursorAnimations((current) => advanceRemoteCursorAnimations(current, timestamp));
        });

        return () => cancelTraceboardCursorFrame(frameId);
    }, [commitCursorAnimations, cursorAnimations]);
}

function useRemoteCursorCleanup(commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void): void {
    useEffect(() => {
        const intervalId = setInterval(() => {
            commitCursorAnimations((current) => removeStaleRemoteCursors(current, performance.now(), TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS));
        }, TRACEBOARD_CURSOR_CLEANUP_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [commitCursorAnimations]);
}

function requestTraceboardCursorFrame(callback: FrameRequestCallback): number {
    if (typeof window.requestAnimationFrame === 'function') {
        return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(() => callback(performance.now()), 16);
}

function cancelTraceboardCursorFrame(frameId: number): void {
    if (typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
        return;
    }

    window.clearTimeout(frameId);
}
