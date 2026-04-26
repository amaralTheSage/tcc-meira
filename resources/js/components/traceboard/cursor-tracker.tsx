import { useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

export function CursorTracker({
    setCanvasCursorPosition,
    clientPos,
}: {
    setCanvasCursorPosition: (position: { x: number; y: number }) => void;
    clientPos: { x: number; y: number };
}) {
    const { screenToFlowPosition } = useReactFlow();

    useEffect(() => {
        const flowPosition = screenToFlowPosition({
            x: clientPos.x,
            y: clientPos.y,
        });

        setCanvasCursorPosition(flowPosition);
    }, [clientPos.x, clientPos.y, screenToFlowPosition, setCanvasCursorPosition]);

    return <></>;
}
