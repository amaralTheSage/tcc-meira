import type { User } from '@/types';
import type { BoardOperation } from '@/types/models';
import type { Connection, Edge, Node, NodeChange } from '@xyflow/react';

export const TRACEBOARD_TOUCH_LOCK_TTL_MS = 8000;
export const TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS = 3000;
export const TRACEBOARD_TOUCH_LOCK_CLEANUP_INTERVAL_MS = 1000;
export const TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS = 1000;

export type TraceboardNodeType = 'Task' | 'Note';
export type TraceboardTouchLockReason = 'pointer' | 'drag' | 'editing' | 'context';

export interface TraceboardTouchLockUser {
    id: number;
    name: string;
    avatar?: string | null;
}

export interface TraceboardNodeTouchLock {
    nodeId: string;
    type: TraceboardNodeType;
    user: TraceboardTouchLockUser;
    expiresAt: number;
}

export type TraceboardNodeTouchStartPayload = TraceboardNodeTouchLock;

export interface TraceboardNodeTouchEndPayload {
    nodeId: string;
    userId: number;
}

export interface TraceboardNodeLockCallbacks {
    endTouchLock?: (nodeId: string, type: TraceboardNodeType, reason: TraceboardTouchLockReason) => void;
    startTouchLock?: (nodeId: string, type: TraceboardNodeType, reason: TraceboardTouchLockReason) => void;
}

export interface TraceboardNodeLockData extends TraceboardNodeLockCallbacks {
    touchLock?: TraceboardNodeTouchLock;
    touchLockIsLocal?: boolean;
    touchLockIsRemote?: boolean;
}

export type TraceboardNodeTouchLocksByNode = Record<string, TraceboardNodeTouchLock>;

/**
 * Builds the whisper payload for a local Traceboard node lock renewal.
 *
 * @example
 * const payload = createTraceboardTouchLockPayload('task-1', 'Task', user, Date.now());
 */
export function createTraceboardTouchLockPayload(
    nodeId: string,
    type: TraceboardNodeType,
    user: User,
    nowMs: number,
): TraceboardNodeTouchStartPayload {
    return {
        expiresAt: nowMs + TRACEBOARD_TOUCH_LOCK_TTL_MS,
        nodeId,
        type,
        user: traceboardTouchLockUser(user),
    };
}

/**
 * Stores a started or renewed Traceboard node lock when it is still fresh.
 *
 * @example
 * const locks = receiveTraceboardNodeTouchStarted({}, payload, Date.now());
 */
export function receiveTraceboardNodeTouchStarted(
    locks: TraceboardNodeTouchLocksByNode,
    payload: TraceboardNodeTouchStartPayload,
    nowMs: number,
): TraceboardNodeTouchLocksByNode {
    if (payload.expiresAt <= nowMs) {
        return locks;
    }

    return { ...locks, [payload.nodeId]: payload };
}

/**
 * Releases a Traceboard lock only when the release belongs to the lock owner.
 *
 * @example
 * const locks = releaseTraceboardNodeTouchLock(currentLocks, { nodeId: 'task-1', userId: 7 });
 */
export function releaseTraceboardNodeTouchLock(
    locks: TraceboardNodeTouchLocksByNode,
    payload: TraceboardNodeTouchEndPayload,
): TraceboardNodeTouchLocksByNode {
    if (locks[payload.nodeId]?.user.id !== payload.userId) {
        return locks;
    }

    const nextLocks = { ...locks };
    delete nextLocks[payload.nodeId];
    return nextLocks;
}

/**
 * Removes locks that outlived their heartbeat expiry.
 *
 * @example
 * const activeLocks = removeStaleTraceboardNodeTouchLocks(locks, Date.now());
 */
export function removeStaleTraceboardNodeTouchLocks(locks: TraceboardNodeTouchLocksByNode, nowMs: number): TraceboardNodeTouchLocksByNode {
    const activeLocks: TraceboardNodeTouchLocksByNode = {};

    Object.values(locks).forEach((lock) => {
        if (lock.expiresAt > nowMs) {
            activeLocks[lock.nodeId] = lock;
        }
    });

    return activeLocks;
}

/**
 * Reports whether a node lock is owned by another user.
 *
 * @example
 * const blocked = isTraceboardNodeRemoteLocked(lock, auth.user.id);
 */
export function isTraceboardNodeRemoteLocked(lock: TraceboardNodeTouchLock | undefined, currentUserId: number): boolean {
    return Boolean(lock && lock.user.id !== currentUserId);
}

/**
 * Adds lock metadata and remote interaction guards to React Flow nodes.
 *
 * @example
 * const decorated = decorateTraceboardNodesWithTouchLocks(nodes, locks, 7, callbacks);
 */
export function decorateTraceboardNodesWithTouchLocks(
    nodes: Node[],
    locks: TraceboardNodeTouchLocksByNode,
    currentUserId: number,
    callbacks: TraceboardNodeLockCallbacks,
): Node[] {
    return nodes.map((node) => decorateTraceboardNodeWithTouchLock(node, locks[node.id], currentUserId, callbacks));
}

/**
 * Drops React Flow node changes that would move or delete a remote-locked node.
 *
 * @example
 * const nextChanges = filterRemoteLockedTraceboardNodeChanges(changes, locks, 7);
 */
export function filterRemoteLockedTraceboardNodeChanges<TNode extends Node>(
    changes: NodeChange<TNode>[],
    locks: TraceboardNodeTouchLocksByNode,
    currentUserId: number,
): NodeChange<TNode>[] {
    return changes.filter((change) => !isRemoteLockedNodeMutation(change, locks, currentUserId));
}

/**
 * Reports whether a connection touches a remote-locked node.
 *
 * @example
 * const blocked = isTraceboardConnectionRemoteLocked(connection, locks, 7);
 */
export function isTraceboardConnectionRemoteLocked(
    connection: Connection | Edge,
    locks: TraceboardNodeTouchLocksByNode,
    currentUserId: number,
): boolean {
    return (
        isTraceboardNodeIdRemoteLocked(connection.source, locks, currentUserId) ||
        isTraceboardNodeIdRemoteLocked(connection.target, locks, currentUserId)
    );
}

/**
 * Reports whether a queued board operation would mutate a remote-locked node.
 *
 * @example
 * const blocked = isTraceboardOperationRemoteLocked(operation, locks, 7);
 */
export function isTraceboardOperationRemoteLocked(operation: BoardOperation, locks: TraceboardNodeTouchLocksByNode, currentUserId: number): boolean {
    if (operation.task?.id && isTraceboardNodeIdRemoteLocked(operation.task.id, locks, currentUserId)) {
        return true;
    }

    return isTraceboardConnectionOperationRemoteLocked(operation, locks, currentUserId);
}

/**
 * Reports whether a React Flow node belongs to Traceboard task or note content.
 *
 * @example
 * const isContentNode = isTraceboardContentNode(node);
 */
export function isTraceboardContentNode(node: Node | undefined): node is Node<Record<string, unknown>, TraceboardNodeType> {
    return node?.type === 'Task' || node?.type === 'Note';
}

/**
 * Lists users currently touching Traceboard cards or notes.
 *
 * @example
 * const userIds = traceboardTouchLockUserIds(locks);
 */
export function traceboardTouchLockUserIds(locks: TraceboardNodeTouchLocksByNode): Set<number> {
    return new Set(Object.values(locks).map((lock) => lock.user.id));
}

function decorateTraceboardNodeWithTouchLock(
    node: Node,
    lock: TraceboardNodeTouchLock | undefined,
    currentUserId: number,
    callbacks: TraceboardNodeLockCallbacks,
): Node {
    const remoteLocked = isTraceboardNodeRemoteLocked(lock, currentUserId);

    return {
        ...node,
        className: remoteLocked ? remoteLockedTraceboardClassName(node.className) : node.className,
        connectable: remoteLocked ? false : node.connectable,
        data: { ...node.data, ...callbacks, touchLock: lock, touchLockIsLocal: Boolean(lock && !remoteLocked), touchLockIsRemote: remoteLocked },
        draggable: remoteLocked ? false : node.draggable,
    };
}

function isRemoteLockedNodeMutation<TNode extends Node>(
    change: NodeChange<TNode>,
    locks: TraceboardNodeTouchLocksByNode,
    currentUserId: number,
): boolean {
    if (change.type !== 'position' && change.type !== 'remove') {
        return false;
    }

    return isTraceboardNodeIdRemoteLocked(change.id, locks, currentUserId);
}

function isTraceboardNodeIdRemoteLocked(nodeId: string | null | undefined, locks: TraceboardNodeTouchLocksByNode, currentUserId: number): boolean {
    return Boolean(nodeId && isTraceboardNodeRemoteLocked(locks[nodeId], currentUserId));
}

function isTraceboardConnectionOperationRemoteLocked(
    operation: BoardOperation,
    locks: TraceboardNodeTouchLocksByNode,
    currentUserId: number,
): boolean {
    const connection = operation.connection;

    if (!connection) {
        return false;
    }

    return isTraceboardConnectionRemoteLocked({ source: connection.source_id, target: connection.target_id } as Connection, locks, currentUserId);
}

function traceboardTouchLockUser(user: User): TraceboardTouchLockUser {
    return {
        avatar: user.avatar ?? null,
        id: user.id,
        name: user.name,
    };
}

function remoteLockedTraceboardClassName(className: string | undefined): string {
    return [className, 'nodrag', 'nopan'].filter(Boolean).join(' ');
}
