import { useReactFlow } from '@xyflow/react';
import { useEffect, useRef, type RefObject } from 'react';
import { useThrottledTraceboardCursorWhispers, type TraceboardCursorWhisperChannel } from './use-throttled-traceboard-cursor-whispers';

interface CursorTrackerProps {
    boardElementRef: RefObject<HTMLElement | null>;
    channel: () => TraceboardCursorWhisperChannel;
    userId: number;
}

export function CursorTracker({ boardElementRef, channel, userId }: CursorTrackerProps): null {
    const { screenToFlowPosition } = useReactFlow();
    const sendCursorPosition = useThrottledTraceboardCursorWhispers(channel, userId);
    const screenToFlowPositionRef = useRef(screenToFlowPosition);
    const sendCursorPositionRef = useRef(sendCursorPosition);

    useEffect(() => {
        screenToFlowPositionRef.current = screenToFlowPosition;
        sendCursorPositionRef.current = sendCursorPosition;
    }, [screenToFlowPosition, sendCursorPosition]);

    useEffect(() => {
        const trackCursorMove = (event: PointerEvent): void => {
            if (!isTraceboardPointerEvent(boardElementRef.current, event)) {
                return;
            }

            sendCursorPositionRef.current(screenToFlowPositionRef.current({ x: event.clientX, y: event.clientY }));
        };

        window.addEventListener('pointermove', trackCursorMove, true);

        return () => window.removeEventListener('pointermove', trackCursorMove, true);
    }, [boardElementRef]);

    return null;
}

function isTraceboardPointerEvent(boardElement: HTMLElement | null, event: PointerEvent): boolean {
    if (!boardElement || !(event.target instanceof Node)) {
        return false;
    }

    return boardElement.contains(event.target);
}
