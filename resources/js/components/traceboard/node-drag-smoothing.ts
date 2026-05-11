import type { Node } from '@xyflow/react';
import {
    TRACEBOARD_REMOTE_MOTION_DURATION_MS,
    easeRemoteCursorProgress,
    interpolateRemoteCursorPoint,
    type RemoteCursorPoint,
} from './cursor-smoothing';

export interface TraceboardNodeDragPayload {
    nodeId: string;
    type: 'Task' | 'Note';
    userId: number | string | null;
    x: number;
    y: number;
}

export interface RemoteTraceboardNodeDragAnimation {
    nodeId: string;
    renderedPoint: RemoteCursorPoint;
    startPoint: RemoteCursorPoint;
    startedAt: number;
    targetPoint: RemoteCursorPoint;
    type: 'Task' | 'Note';
}

export type RemoteTraceboardNodeDragAnimationsByNode = Record<string, RemoteTraceboardNodeDragAnimation>;

/**
 * Reports whether a NodeDragged payload came from another Traceboard user.
 *
 * @example
 * const remote = shouldReceiveRemoteTraceboardNodeDrag(payload, 7);
 */
export function shouldReceiveRemoteTraceboardNodeDrag(payload: TraceboardNodeDragPayload, currentUserId: number): boolean {
    if (payload.userId === null) {
        return true;
    }

    return String(payload.userId) !== String(currentUserId);
}

/**
 * Stores a remote Traceboard node drag target from the currently rendered point.
 *
 * @example
 * const next = receiveRemoteTraceboardNodeDragTarget({}, payload, { x: 0, y: 0 }, performance.now());
 */
export function receiveRemoteTraceboardNodeDragTarget(
    animations: RemoteTraceboardNodeDragAnimationsByNode,
    payload: TraceboardNodeDragPayload,
    renderedPoint: RemoteCursorPoint,
    nowMs: number,
): RemoteTraceboardNodeDragAnimationsByNode {
    const targetPoint: RemoteCursorPoint = { x: payload.x, y: payload.y };

    return {
        ...animations,
        [payload.nodeId]: {
            nodeId: payload.nodeId,
            renderedPoint,
            startPoint: renderedPoint,
            startedAt: nowMs,
            targetPoint,
            type: payload.type,
        },
    };
}

/**
 * Advances all remote Traceboard node drag animations to a timestamp.
 *
 * @example
 * const next = advanceRemoteTraceboardNodeDragAnimations(animations, performance.now());
 */
export function advanceRemoteTraceboardNodeDragAnimations(
    animations: RemoteTraceboardNodeDragAnimationsByNode,
    nowMs: number,
): RemoteTraceboardNodeDragAnimationsByNode {
    const advancedAnimations: RemoteTraceboardNodeDragAnimationsByNode = {};

    Object.values(animations).forEach((animation) => {
        const elapsedMs = nowMs - animation.startedAt;
        const easedProgress = easeRemoteCursorProgress(elapsedMs / TRACEBOARD_REMOTE_MOTION_DURATION_MS);
        advancedAnimations[animation.nodeId] = {
            ...animation,
            renderedPoint: interpolateRemoteCursorPoint(animation.startPoint, animation.targetPoint, easedProgress),
        };
    });

    return advancedAnimations;
}

/**
 * Applies rendered remote Traceboard drag positions to React Flow nodes.
 *
 * @example
 * const nodes = applyRemoteTraceboardNodeDragAnimations(currentNodes, animations);
 */
export function applyRemoteTraceboardNodeDragAnimations(nodes: Node[], animations: RemoteTraceboardNodeDragAnimationsByNode): Node[] {
    if (Object.keys(animations).length === 0) {
        return nodes;
    }

    let changedNode = false;
    const renderedNodes = nodes.map((node) => {
        const animation = animations[node.id];

        if (!animation) {
            return node;
        }

        changedNode = true;
        return { ...node, position: animation.renderedPoint };
    });

    return changedNode ? renderedNodes : nodes;
}

/**
 * Reports whether any remote Traceboard node is still gliding.
 *
 * @example
 * const active = hasMovingRemoteTraceboardNodeDrags(animations, performance.now());
 */
export function hasMovingRemoteTraceboardNodeDrags(animations: RemoteTraceboardNodeDragAnimationsByNode, nowMs: number): boolean {
    return Object.values(animations).some(
        (animation) =>
            (animation.startPoint.x !== animation.targetPoint.x || animation.startPoint.y !== animation.targetPoint.y) &&
            nowMs - animation.startedAt < TRACEBOARD_REMOTE_MOTION_DURATION_MS,
    );
}
