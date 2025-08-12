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

    const flowPosition = screenToFlowPosition({
        x: clientPos.x,
        y: clientPos.y,
    });

    useEffect(() => {
        setCanvasCursorPosition(flowPosition);
    }, [clientPos]);

    return <></>;
}
