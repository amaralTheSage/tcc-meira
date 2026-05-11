import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
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
import { cancelTraceboardAnimationFrame, requestTraceboardAnimationFrame } from './traceboard-animation-frame';

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
    const { commitCursorAnimations, cursorAnimations, cursorAnimationsRef } = useRemoteCursorAnimationStore();
    const animationFrameIdRef = useRef<number | null>(null);
    const animateCursorFrame = useRemoteCursorAnimationFrame(animationFrameIdRef, cursorAnimationsRef, commitCursorAnimations);
    const receiveWhisperedCursor = useCallback(
        (payload: TraceboardCursorWhisperPayload): void => {
            storeCursorTarget(payload, cursorAnimationsRef, commitCursorAnimations);
            requestNextCursorFrame(animationFrameIdRef, cursorAnimationsRef.current, animateCursorFrame, performance.now());
        },
        [animateCursorFrame, commitCursorAnimations, cursorAnimationsRef],
    );

    useTraceboardCursorWhispers(channel, receiveWhisperedCursor);
    useRemoteCursorCleanup(commitCursorAnimations);
    useEffect(() => () => cancelPendingCursorFrame(animationFrameIdRef), []);

    return useMemo(() => createRemoteCursorNodes(cursorAnimations), [cursorAnimations]);
}

function useRemoteCursorAnimationStore(): {
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void;
    cursorAnimations: RemoteCursorAnimationsByUser;
    cursorAnimationsRef: MutableRefObject<RemoteCursorAnimationsByUser>;
} {
    const [cursorAnimations, setCursorAnimations] = useState<RemoteCursorAnimationsByUser>({});
    const cursorAnimationsRef = useRef<RemoteCursorAnimationsByUser>({});

    const commitCursorAnimations = useCallback((update: UpdateRemoteCursorAnimations): void => {
        const nextAnimations = update(cursorAnimationsRef.current);
        cursorAnimationsRef.current = nextAnimations;
        setCursorAnimations(nextAnimations);
    }, []);

    return { commitCursorAnimations, cursorAnimations, cursorAnimationsRef };
}

function useTraceboardCursorWhispers(
    channel: () => TraceboardCursorWhisperChannel,
    receiveWhisperedCursor: (payload: TraceboardCursorWhisperPayload) => void,
): void {
    const channelRef = useRef(channel);

    useEffect(() => {
        channelRef.current = channel;
    }, [channel]);

    useEffect(() => {
        const cursorChannel = channelRef.current();
        cursorChannel.listenForWhisper('cursorMoved', receiveWhisperedCursor);

        return () => {
            cursorChannel.stopListeningForWhisper('cursorMoved', receiveWhisperedCursor);
        };
    }, [receiveWhisperedCursor]);
}

function useRemoteCursorAnimationFrame(
    animationFrameIdRef: MutableRefObject<number | null>,
    cursorAnimationsRef: MutableRefObject<RemoteCursorAnimationsByUser>,
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void,
): FrameRequestCallback {
    const animateCursorFrame = useCallback(
        (timestamp: number): void => {
            animationFrameIdRef.current = null;
            const advancedAnimations = advanceRemoteCursorAnimations(cursorAnimationsRef.current, timestamp);
            commitCursorAnimations(() => advancedAnimations);
            requestNextCursorFrame(animationFrameIdRef, advancedAnimations, animateCursorFrame, timestamp);
        },
        [animationFrameIdRef, commitCursorAnimations, cursorAnimationsRef],
    );

    return animateCursorFrame;
}

function storeCursorTarget(
    payload: TraceboardCursorWhisperPayload,
    cursorAnimationsRef: MutableRefObject<RemoteCursorAnimationsByUser>,
    commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void,
): void {
    const nowMs = performance.now();
    const renderedCurrent = advanceRemoteCursorAnimations(cursorAnimationsRef.current, nowMs);
    const nextAnimations = receiveRemoteCursorTarget(renderedCurrent, payload, nowMs);

    commitCursorAnimations(() => nextAnimations);
}

function requestNextCursorFrame(
    animationFrameIdRef: MutableRefObject<number | null>,
    cursorAnimations: RemoteCursorAnimationsByUser,
    animateCursorFrame: FrameRequestCallback,
    nowMs: number,
): void {
    if (animationFrameIdRef.current !== null || !hasMovingRemoteCursors(cursorAnimations, nowMs)) {
        return;
    }

    animationFrameIdRef.current = requestTraceboardAnimationFrame(animateCursorFrame);
}

function cancelPendingCursorFrame(animationFrameIdRef: MutableRefObject<number | null>): void {
    if (animationFrameIdRef.current === null) {
        return;
    }

    cancelTraceboardAnimationFrame(animationFrameIdRef.current);
}

function useRemoteCursorCleanup(commitCursorAnimations: (update: UpdateRemoteCursorAnimations) => void): void {
    useEffect(() => {
        const intervalId = setInterval(() => {
            commitCursorAnimations((current) => removeStaleRemoteCursors(current, performance.now(), TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS));
        }, TRACEBOARD_CURSOR_CLEANUP_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [commitCursorAnimations]);
}
