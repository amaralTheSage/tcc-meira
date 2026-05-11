import { useEcho } from '@laravel/echo-react';
import type { Node } from '@xyflow/react';
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import {
    advanceRemoteTraceboardNodeDragAnimations,
    applyRemoteTraceboardNodeDragAnimations,
    hasMovingRemoteTraceboardNodeDrags,
    receiveRemoteTraceboardNodeDragTarget,
    shouldReceiveRemoteTraceboardNodeDrag,
    type RemoteTraceboardNodeDragAnimationsByNode,
    type TraceboardNodeDragPayload,
} from './node-drag-smoothing';
import { cancelTraceboardAnimationFrame, requestTraceboardAnimationFrame } from './traceboard-animation-frame';

type ReplaceTraceboardNodes = (nodes: Node[]) => void;

/**
 * Owns smooth board-level Traceboard task and note drag broadcasts.
 *
 * @example
 * useSmoothedTraceboardNodeDrags(auth.user.id, nodes, setNodes);
 */
export function useSmoothedTraceboardNodeDrags(currentUserId: number, nodes: Node[], replaceTraceboardNodes: ReplaceTraceboardNodes): void {
    const animationFrameIdRef = useRef<number | null>(null);
    const dragAnimationsRef = useRef<RemoteTraceboardNodeDragAnimationsByNode>({});
    const nodesRef = useRef<Node[]>(nodes);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    const animateDragFrame = useCallback(
        (timestamp: number): void => {
            animationFrameIdRef.current = null;
            const advancedAnimations = advanceRemoteTraceboardNodeDragAnimations(dragAnimationsRef.current, timestamp);
            const renderedNodes = applyRemoteTraceboardNodeDragAnimations(nodesRef.current, advancedAnimations);
            nodesRef.current = renderedNodes;
            replaceTraceboardNodes(renderedNodes);
            dragAnimationsRef.current = hasMovingRemoteTraceboardNodeDrags(advancedAnimations, timestamp) ? advancedAnimations : {};
            requestNextDragFrame(animationFrameIdRef, dragAnimationsRef.current, animateDragFrame, timestamp);
        },
        [replaceTraceboardNodes],
    );

    const receiveNodeDrag = useCallback(
        (payload: TraceboardNodeDragPayload): void => {
            if (!shouldReceiveRemoteTraceboardNodeDrag(payload, currentUserId)) {
                return;
            }

            storeNodeDragTarget(payload, nodesRef, dragAnimationsRef, replaceTraceboardNodes);
            requestNextDragFrame(animationFrameIdRef, dragAnimationsRef.current, animateDragFrame, performance.now());
        },
        [animateDragFrame, currentUserId, replaceTraceboardNodes],
    );

    useEcho<TraceboardNodeDragPayload>('tasks', 'NodeDragged', receiveNodeDrag);

    useEffect(() => {
        return () => {
            cancelPendingDragFrame(animationFrameIdRef);
        };
    }, []);
}

function storeNodeDragTarget(
    payload: TraceboardNodeDragPayload,
    nodesRef: MutableRefObject<Node[]>,
    dragAnimationsRef: MutableRefObject<RemoteTraceboardNodeDragAnimationsByNode>,
    replaceTraceboardNodes: ReplaceTraceboardNodes,
): void {
    const nowMs = performance.now();
    const currentAnimations = advanceRemoteTraceboardNodeDragAnimations(dragAnimationsRef.current, nowMs);
    const renderedNodes = applyRemoteTraceboardNodeDragAnimations(nodesRef.current, currentAnimations);
    const draggedNode = renderedNodes.find((node) => node.id === payload.nodeId);
    nodesRef.current = renderedNodes;
    replaceTraceboardNodes(renderedNodes);

    if (draggedNode) {
        dragAnimationsRef.current = receiveRemoteTraceboardNodeDragTarget(currentAnimations, payload, draggedNode.position, nowMs);
    }
}

function requestNextDragFrame(
    animationFrameIdRef: MutableRefObject<number | null>,
    dragAnimations: RemoteTraceboardNodeDragAnimationsByNode,
    animateDragFrame: FrameRequestCallback,
    nowMs: number,
): void {
    if (animationFrameIdRef.current !== null || !hasMovingRemoteTraceboardNodeDrags(dragAnimations, nowMs)) {
        return;
    }

    animationFrameIdRef.current = requestTraceboardAnimationFrame(animateDragFrame);
}

function cancelPendingDragFrame(animationFrameIdRef: MutableRefObject<number | null>): void {
    if (animationFrameIdRef.current === null) {
        return;
    }

    cancelTraceboardAnimationFrame(animationFrameIdRef.current);
}
