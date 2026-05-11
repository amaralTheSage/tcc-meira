import type { Node } from '@xyflow/react';
import type { MutableRefObject } from 'react';
import {
    isTraceboardContentNode,
    isTraceboardNodeRemoteLocked,
    type TraceboardNodeTouchLocksByNode,
    type TraceboardNodeType,
} from './traceboard-node-touch-locks';

type PointerLockCallbacks = {
    endTouchLock: (nodeId: string, type: TraceboardNodeType, reason: 'pointer' | 'drag') => void;
    startTouchLock: (nodeId: string, type: TraceboardNodeType, reason: 'pointer') => void;
};

/**
 * Starts and releases Traceboard pointer locks from board-level pointer events.
 *
 * @example
 * const cleanup = listenForTraceboardPointerLocks(board, nodesRef, locksRef, userId, callbacks);
 */
export function listenForTraceboardPointerLocks(
    boardElement: HTMLElement,
    nodesRef: MutableRefObject<Node[]>,
    locksRef: MutableRefObject<TraceboardNodeTouchLocksByNode>,
    currentUserId: number,
    callbacks: PointerLockCallbacks,
): () => void {
    const pointerLocks = new Map<number, { nodeId: string; type: TraceboardNodeType }>();
    const pointerDown = (event: PointerEvent) => startPointerTouchLock(event, nodesRef, locksRef, currentUserId, callbacks, pointerLocks);
    const pointerEnd = (event: PointerEvent) => endPointerTouchLock(event, pointerLocks, callbacks);

    boardElement.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointerup', pointerEnd, { capture: true });
    window.addEventListener('pointercancel', pointerEnd, { capture: true });

    return () => removeTraceboardPointerLockListeners(boardElement, pointerDown, pointerEnd);
}

function startPointerTouchLock(
    event: PointerEvent,
    nodesRef: MutableRefObject<Node[]>,
    locksRef: MutableRefObject<TraceboardNodeTouchLocksByNode>,
    currentUserId: number,
    callbacks: PointerLockCallbacks,
    pointerLocks: Map<number, { nodeId: string; type: TraceboardNodeType }>,
): void {
    const node = nodesRef.current.find((node) => node.id === traceboardNodeIdFromPointerEvent(event));

    if (!isTraceboardContentNode(node) || isTraceboardNodeRemoteLocked(locksRef.current[node.id], currentUserId)) {
        return;
    }

    pointerLocks.set(event.pointerId, { nodeId: node.id, type: node.type });
    callbacks.startTouchLock(node.id, node.type, 'pointer');
}

function endPointerTouchLock(
    event: PointerEvent,
    pointerLocks: Map<number, { nodeId: string; type: TraceboardNodeType }>,
    callbacks: PointerLockCallbacks,
): void {
    const lockedNode = pointerLocks.get(event.pointerId);

    if (!lockedNode) {
        return;
    }

    pointerLocks.delete(event.pointerId);
    callbacks.endTouchLock(lockedNode.nodeId, lockedNode.type, 'pointer');
    callbacks.endTouchLock(lockedNode.nodeId, lockedNode.type, 'drag');
}

function removeTraceboardPointerLockListeners(
    boardElement: HTMLElement,
    pointerDown: (event: PointerEvent) => void,
    pointerEnd: (event: PointerEvent) => void,
): void {
    boardElement.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('pointerup', pointerEnd, { capture: true });
    window.removeEventListener('pointercancel', pointerEnd, { capture: true });
}

function traceboardNodeIdFromPointerEvent(event: PointerEvent): string | null {
    if (!(event.target instanceof Element)) {
        return null;
    }

    return event.target.closest<HTMLElement>('.react-flow__node[data-id]')?.dataset.id ?? null;
}
