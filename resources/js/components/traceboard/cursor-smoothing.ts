import type { Node } from '@xyflow/react';
import { TRACEBOARD_USER_ACCENT_PALETTE, traceboardUserAccentColor } from './traceboard-user-colors';

export const TRACEBOARD_LIVE_UPDATE_INTERVAL_MS = 1000;
export const TRACEBOARD_REMOTE_MOTION_DURATION_MS = TRACEBOARD_LIVE_UPDATE_INTERVAL_MS;
export const TRACEBOARD_REMOTE_CURSOR_ANIMATION_MS = TRACEBOARD_REMOTE_MOTION_DURATION_MS;
export const TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS = 10000;
export const TRACEBOARD_CURSOR_CLEANUP_INTERVAL_MS = 30000;
export const TRACEBOARD_REMOTE_CURSOR_SIZE_PX = 24;
export const TRACEBOARD_REMOTE_CURSOR_PALETTE = TRACEBOARD_USER_ACCENT_PALETTE;

export interface RemoteCursorPoint {
    x: number;
    y: number;
}

export interface TraceboardCursorWhisperPayload extends RemoteCursorPoint {
    id: number;
}

export interface RemoteCursorAnimation {
    lastActiveAt: number;
    renderedPoint: RemoteCursorPoint;
    startPoint: RemoteCursorPoint;
    startedAt: number;
    targetPoint: RemoteCursorPoint;
    userId: number;
}

export type RemoteCursorAnimationsByUser = Record<number, RemoteCursorAnimation>;
export type TraceboardRemoteCursorNode = Node<TraceboardRemoteCursorNodeData, 'UserCursor'>;

interface TraceboardRemoteCursorNodeData extends Record<string, unknown> {
    color: string;
    userId: number;
}

/**
 * Applies the Traceboard remote motion smoothstep curve.
 *
 * @example
 * const progress = easeRemoteCursorProgress(0.5);
 */
export function easeRemoteCursorProgress(t: number): number {
    const clampedProgress = Math.min(Math.max(t, 0), 1);

    return clampedProgress * clampedProgress * (3 - 2 * clampedProgress);
}

/**
 * Interpolates between two Traceboard cursor points.
 *
 * @example
 * const point = interpolateRemoteCursorPoint({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5);
 */
export function interpolateRemoteCursorPoint(start: RemoteCursorPoint, end: RemoteCursorPoint, progress: number): RemoteCursorPoint {
    return {
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
    };
}

/**
 * Builds React Flow node ids for remote Traceboard cursors.
 *
 * @example
 * const nodeId = remoteTraceboardCursorNodeId(7);
 */
export function remoteTraceboardCursorNodeId(userId: number): string {
    return `remote-cursor:${userId}`;
}

/**
 * Picks a deterministic high-contrast Traceboard cursor color.
 *
 * @example
 * const color = remoteTraceboardCursorColor(7);
 */
export function remoteTraceboardCursorColor(userId: number): string {
    return traceboardUserAccentColor(userId);
}

/**
 * Hides remote cursors for users actively touching Traceboard cards.
 *
 * @example
 * const visible = filterRemoteCursorNodesForUnlockedUsers(nodes, new Set([7]));
 */
export function filterRemoteCursorNodesForUnlockedUsers(
    nodes: TraceboardRemoteCursorNode[],
    lockedUserIds: ReadonlySet<number>,
): TraceboardRemoteCursorNode[] {
    return nodes.filter((node) => !lockedUserIds.has(node.data.userId));
}

/**
 * Stores a received Traceboard cursor target.
 *
 * @example
 * const next = receiveRemoteCursorTarget({}, { id: 7, x: 10, y: 20 }, performance.now());
 */
export function receiveRemoteCursorTarget(
    cursors: RemoteCursorAnimationsByUser,
    payload: TraceboardCursorWhisperPayload,
    nowMs: number,
): RemoteCursorAnimationsByUser {
    const targetPoint: RemoteCursorPoint = { x: payload.x, y: payload.y };
    const existingCursor = cursors[payload.id];
    const startPoint = existingCursor ? { ...existingCursor.renderedPoint } : targetPoint;

    return {
        ...cursors,
        [payload.id]: {
            lastActiveAt: nowMs,
            renderedPoint: startPoint,
            startPoint,
            startedAt: nowMs,
            targetPoint,
            userId: payload.id,
        },
    };
}

/**
 * Advances all rendered cursor positions to a specific animation timestamp.
 *
 * @example
 * const next = advanceRemoteCursorAnimations(cursors, performance.now());
 */
export function advanceRemoteCursorAnimations(cursors: RemoteCursorAnimationsByUser, nowMs: number): RemoteCursorAnimationsByUser {
    const nextCursors: RemoteCursorAnimationsByUser = {};

    Object.values(cursors).forEach((cursor) => {
        const elapsedMs = nowMs - cursor.startedAt;
        const easedProgress = easeRemoteCursorProgress(elapsedMs / TRACEBOARD_REMOTE_CURSOR_ANIMATION_MS);
        nextCursors[cursor.userId] = {
            ...cursor,
            renderedPoint: interpolateRemoteCursorPoint(cursor.startPoint, cursor.targetPoint, easedProgress),
        };
    });

    return nextCursors;
}

/**
 * Reports whether any Traceboard remote cursor is still animating.
 *
 * @example
 * const active = hasMovingRemoteCursors(cursors, performance.now());
 */
export function hasMovingRemoteCursors(cursors: RemoteCursorAnimationsByUser, nowMs: number): boolean {
    return Object.values(cursors).some(
        (cursor) =>
            (cursor.startPoint.x !== cursor.targetPoint.x || cursor.startPoint.y !== cursor.targetPoint.y) &&
            nowMs - cursor.startedAt < TRACEBOARD_REMOTE_CURSOR_ANIMATION_MS,
    );
}

/**
 * Removes Traceboard cursors that have exceeded the inactivity threshold.
 *
 * @example
 * const visible = removeStaleRemoteCursors(cursors, performance.now(), TRACEBOARD_INACTIVE_CURSOR_THRESHOLD_MS);
 */
export function removeStaleRemoteCursors(cursors: RemoteCursorAnimationsByUser, nowMs: number, thresholdMs: number): RemoteCursorAnimationsByUser {
    const visibleCursors: RemoteCursorAnimationsByUser = {};

    Object.values(cursors).forEach((cursor) => {
        if (nowMs - cursor.lastActiveAt < thresholdMs) {
            visibleCursors[cursor.userId] = cursor;
        }
    });

    return visibleCursors;
}

/**
 * Converts rendered Traceboard cursor positions into React Flow nodes.
 *
 * @example
 * const nodes = createRemoteCursorNodes(cursors);
 */
export function createRemoteCursorNodes(cursors: RemoteCursorAnimationsByUser): TraceboardRemoteCursorNode[] {
    return Object.values(cursors).map((cursor) => ({
        id: remoteTraceboardCursorNodeId(cursor.userId),
        data: {
            color: remoteTraceboardCursorColor(cursor.userId),
            userId: cursor.userId,
        },
        draggable: false,
        focusable: false,
        height: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
        initialHeight: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
        initialWidth: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
        measured: {
            height: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
            width: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
        },
        position: cursor.renderedPoint,
        selectable: false,
        style: { pointerEvents: 'none' },
        type: 'UserCursor',
        width: TRACEBOARD_REMOTE_CURSOR_SIZE_PX,
    }));
}
