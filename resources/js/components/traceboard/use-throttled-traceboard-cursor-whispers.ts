import { useCallback, useEffect, useRef } from 'react';
import { TRACEBOARD_LIVE_UPDATE_INTERVAL_MS, type RemoteCursorPoint, type TraceboardCursorWhisperPayload } from './cursor-smoothing';

export interface TraceboardCursorWhisperChannel {
    whisper(event: string, payload: TraceboardCursorWhisperPayload): void;
}

/**
 * Returns a leading and trailing throttled Traceboard cursor whisper sender.
 *
 * @example
 * const sendCursor = useThrottledTraceboardCursorWhispers(channel, auth.user.id);
 */
export function useThrottledTraceboardCursorWhispers(
    channel: () => TraceboardCursorWhisperChannel,
    userId: number,
): (position: RemoteCursorPoint) => void {
    const channelRef = useRef(channel);
    const lastSentAtRef = useRef<number | null>(null);
    const pendingCursorPointRef = useRef<RemoteCursorPoint | null>(null);
    const trailingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        channelRef.current = channel;
    }, [channel]);

    const flushCursorPoint = useCallback(
        (position: RemoteCursorPoint): void => {
            lastSentAtRef.current = Date.now();
            pendingCursorPointRef.current = null;
            channelRef.current().whisper('cursorMoved', { id: userId, x: position.x, y: position.y });
        },
        [userId],
    );

    const clearTrailingTimer = useCallback((): void => {
        if (trailingTimerRef.current === null) {
            return;
        }

        window.clearTimeout(trailingTimerRef.current);
        trailingTimerRef.current = null;
    }, []);

    const scheduleTrailingCursorPoint = useCallback(
        (waitMs: number): void => {
            if (trailingTimerRef.current !== null) {
                return;
            }

            trailingTimerRef.current = window.setTimeout(() => {
                trailingTimerRef.current = null;
                const pendingPoint = pendingCursorPointRef.current;
                if (pendingPoint) flushCursorPoint(pendingPoint);
            }, waitMs);
        },
        [flushCursorPoint],
    );

    useEffect(() => clearTrailingTimer, [clearTrailingTimer]);

    return useCallback(
        (position: RemoteCursorPoint): void => {
            const lastSentAt = lastSentAtRef.current;
            if (lastSentAt === null || Date.now() - lastSentAt >= TRACEBOARD_LIVE_UPDATE_INTERVAL_MS) {
                clearTrailingTimer();
                flushCursorPoint(position);
                return;
            }

            pendingCursorPointRef.current = position;
            scheduleTrailingCursorPoint(TRACEBOARD_LIVE_UPDATE_INTERVAL_MS - (Date.now() - lastSentAt));
        },
        [clearTrailingTimer, flushCursorPoint, scheduleTrailingCursorPoint],
    );
}
