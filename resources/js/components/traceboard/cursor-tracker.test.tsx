import { render } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CursorTracker } from './cursor-tracker';
import type { TraceboardCursorWhisperChannel } from './use-throttled-traceboard-cursor-whispers';

vi.mock('@xyflow/react', () => ({
    useReactFlow: () => ({
        screenToFlowPosition: ({ x, y }: { x: number; y: number }) => ({ x: x + 1, y: y + 2 }),
    }),
}));

describe('CursorTracker', () => {
    it('tracks board pointer movement even when the board ref becomes available after mount', () => {
        const boardElementRef = { current: null as HTMLElement | null };
        const channel = fakeCursorWhisperChannel();
        render(<CursorTracker boardElementRef={boardElementRef} channel={() => channel} userId={7} />);

        const boardElement = document.createElement('main');
        const boardChild = document.createElement('button');
        boardElement.appendChild(boardChild);
        document.body.appendChild(boardElement);
        boardElementRef.current = boardElement;

        act(() => {
            boardChild.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 20 }));
        });

        expect(channel.whisper).toHaveBeenCalledWith('cursorMoved', { id: 7, x: 11, y: 22 });
    });

    it('ignores pointer movement outside the board element', () => {
        const boardElementRef = { current: document.createElement('main') };
        const channel = fakeCursorWhisperChannel();
        render(<CursorTracker boardElementRef={boardElementRef} channel={() => channel} userId={7} />);

        act(() => {
            window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 10, clientY: 20 }));
        });

        expect(channel.whisper).not.toHaveBeenCalled();
    });
});

function fakeCursorWhisperChannel(): TraceboardCursorWhisperChannel {
    return {
        whisper: vi.fn(),
    };
}
