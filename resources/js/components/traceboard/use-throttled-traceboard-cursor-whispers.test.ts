import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TRACEBOARD_LIVE_UPDATE_INTERVAL_MS } from './cursor-smoothing';
import { useThrottledTraceboardCursorWhispers, type TraceboardCursorWhisperChannel } from './use-throttled-traceboard-cursor-whispers';

describe('useThrottledTraceboardCursorWhispers', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends the first cursor point immediately and trails the latest point once per second', () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const channel = fakeCursorWhisperChannel();
        const { result, unmount } = renderHook(() => useThrottledTraceboardCursorWhispers(() => channel, 7));

        act(() => result.current({ x: 10, y: 20 }));
        expect(channel.whisper).toHaveBeenCalledTimes(1);
        expect(channel.whisper).toHaveBeenLastCalledWith('cursorMoved', { id: 7, x: 10, y: 20 });

        act(() => {
            vi.setSystemTime(250);
            result.current({ x: 30, y: 40 });
            result.current({ x: 50, y: 60 });
        });
        expect(channel.whisper).toHaveBeenCalledTimes(1);

        act(() => {
            vi.setSystemTime(TRACEBOARD_LIVE_UPDATE_INTERVAL_MS);
            vi.advanceTimersByTime(750);
        });
        expect(channel.whisper).toHaveBeenCalledTimes(2);
        expect(channel.whisper).toHaveBeenLastCalledWith('cursorMoved', { id: 7, x: 50, y: 60 });

        unmount();
    });

    it('uses the latest Echo channel function when a trailing cursor point flushes', () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const firstChannel = fakeCursorWhisperChannel();
        const secondChannel = fakeCursorWhisperChannel();
        const { result, rerender, unmount } = renderHook(({ channel }) => useThrottledTraceboardCursorWhispers(() => channel, 7), {
            initialProps: { channel: firstChannel },
        });

        act(() => result.current({ x: 10, y: 20 }));
        rerender({ channel: secondChannel });
        act(() => result.current({ x: 30, y: 40 }));
        act(() => {
            vi.setSystemTime(TRACEBOARD_LIVE_UPDATE_INTERVAL_MS);
            vi.advanceTimersByTime(TRACEBOARD_LIVE_UPDATE_INTERVAL_MS);
        });

        expect(firstChannel.whisper).toHaveBeenCalledTimes(1);
        expect(secondChannel.whisper).toHaveBeenCalledWith('cursorMoved', { id: 7, x: 30, y: 40 });

        unmount();
    });
});

function fakeCursorWhisperChannel(): TraceboardCursorWhisperChannel {
    return {
        whisper: vi.fn(),
    };
}
