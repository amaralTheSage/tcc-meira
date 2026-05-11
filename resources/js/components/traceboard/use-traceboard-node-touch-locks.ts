import type { User } from '@/types';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import {
    TRACEBOARD_TOUCH_LOCK_CLEANUP_INTERVAL_MS,
    TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS,
    TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS,
    createTraceboardTouchLockPayload,
    receiveTraceboardNodeTouchStarted,
    releaseTraceboardNodeTouchLock,
    removeStaleTraceboardNodeTouchLocks,
    type TraceboardNodeTouchEndPayload,
    type TraceboardNodeTouchLocksByNode,
    type TraceboardNodeTouchStartPayload,
    type TraceboardNodeType,
    type TraceboardTouchLockReason,
} from './traceboard-node-touch-locks';

interface TraceboardNodeTouchLockChannel {
    listenForWhisper(event: string, callback: (payload: TraceboardNodeTouchStartPayload | TraceboardNodeTouchEndPayload) => void): unknown;
    stopListeningForWhisper(event: string, callback: (payload: TraceboardNodeTouchStartPayload | TraceboardNodeTouchEndPayload) => void): unknown;
    whisper(event: string, payload: TraceboardNodeTouchStartPayload | TraceboardNodeTouchEndPayload): unknown;
}

interface LocalTraceboardTouchLockReasons {
    reasonVersions: Partial<Record<TraceboardTouchLockReason, number>>;
    reasons: Set<TraceboardTouchLockReason>;
    type: TraceboardNodeType;
}

interface UseTraceboardNodeTouchLocksResult {
    endTouchLock: (nodeId: string, type: TraceboardNodeType, reason: TraceboardTouchLockReason) => void;
    nodeTouchLocks: TraceboardNodeTouchLocksByNode;
    startTouchLock: (nodeId: string, type: TraceboardNodeType, reason: TraceboardTouchLockReason) => void;
}

type LocalTouchLockReasonsByNode = Record<string, LocalTraceboardTouchLockReasons>;
type PendingDragReleaseTimersByNode = Partial<Record<string, ReturnType<typeof setTimeout>>>;
type CommitTouchLocks = (update: (current: TraceboardNodeTouchLocksByNode) => TraceboardNodeTouchLocksByNode) => void;

/**
 * Owns ephemeral Echo whisper locks for active Traceboard task and note touches.
 *
 * @example
 * const locks = useTraceboardNodeTouchLocks(auth.user);
 */
export function useTraceboardNodeTouchLocks(currentUser: User): UseTraceboardNodeTouchLocksResult {
    const { channel } = useEcho<TraceboardNodeTouchStartPayload>('tasks');
    const channelRef = useRef(channel);
    const { commitTouchLocks, nodeTouchLocks } = useTraceboardTouchLockStore();
    const localReasonsRef = useRef<LocalTouchLockReasonsByNode>({});
    const localReasonVersionRef = useRef(0);
    const pendingDragReleasesRef = useRef<PendingDragReleaseTimersByNode>({});
    const touchChannel = useCallback(() => channelRef.current(), []);

    useEffect(() => {
        channelRef.current = channel;
    }, [channel]);

    useRemoteTraceboardTouchLockWhispers(touchChannel, commitTouchLocks);
    useTraceboardTouchLockHeartbeat(touchChannel, currentUser, localReasonsRef, commitTouchLocks);
    useTraceboardTouchLockCleanup(commitTouchLocks);
    useTraceboardTouchLockUnmountRelease(touchChannel, currentUser.id, localReasonsRef, pendingDragReleasesRef);

    const startTouchLock = useCallback(
        (nodeId: string, type: TraceboardNodeType, reason: TraceboardTouchLockReason): void => {
            clearPendingDragRelease(pendingDragReleasesRef.current, nodeId);
            localReasonVersionRef.current += 1;
            storeLocalTouchLockReason(localReasonsRef.current, nodeId, type, reason, localReasonVersionRef.current);
            whisperTraceboardTouchStarted(touchChannel(), currentUser, nodeId, type, commitTouchLocks);
        },
        [commitTouchLocks, currentUser, touchChannel],
    );

    const endTouchLock = useCallback(
        (nodeId: string, _type: TraceboardNodeType, reason: TraceboardTouchLockReason): void => {
            if (reason === 'drag') {
                if (!hasLocalTouchLockReason(localReasonsRef.current, nodeId, 'drag')) {
                    return;
                }

                releaseLocalDragTouchLock(currentUser.id, localReasonsRef, nodeId, commitTouchLocks);
                scheduleDragTouchLockRelease(touchChannel, currentUser.id, localReasonsRef, pendingDragReleasesRef, nodeId, commitTouchLocks);
                return;
            }

            if (!hasLocalTouchLockReason(localReasonsRef.current, nodeId, reason)) {
                return;
            }

            if (releaseLocalTouchLockReason(localReasonsRef.current, nodeId, reason)) {
                return;
            }

            if (hasPendingDragRelease(pendingDragReleasesRef.current, nodeId)) {
                releaseLocalRenderedTouchLock(currentUser.id, nodeId, commitTouchLocks);
                return;
            }

            whisperTraceboardTouchEnded(touchChannel(), currentUser.id, nodeId, commitTouchLocks);
        },
        [commitTouchLocks, currentUser.id, touchChannel],
    );

    return { endTouchLock, nodeTouchLocks, startTouchLock };
}

function useTraceboardTouchLockStore(): {
    commitTouchLocks: CommitTouchLocks;
    nodeTouchLocks: TraceboardNodeTouchLocksByNode;
} {
    const [nodeTouchLocks, setNodeTouchLocks] = useState<TraceboardNodeTouchLocksByNode>({});
    const nodeTouchLocksRef = useRef<TraceboardNodeTouchLocksByNode>({});

    const commitTouchLocks = useCallback((update: (current: TraceboardNodeTouchLocksByNode) => TraceboardNodeTouchLocksByNode): void => {
        const nextLocks = update(nodeTouchLocksRef.current);
        nodeTouchLocksRef.current = nextLocks;
        setNodeTouchLocks(nextLocks);
    }, []);

    return { commitTouchLocks, nodeTouchLocks };
}

function useRemoteTraceboardTouchLockWhispers(channel: () => TraceboardNodeTouchLockChannel, commitTouchLocks: CommitTouchLocks): void {
    const receiveTouchStarted = useCallback(
        (payload: TraceboardNodeTouchStartPayload | TraceboardNodeTouchEndPayload): void => {
            if ('expiresAt' in payload) {
                commitTouchLocks((current) => receiveTraceboardNodeTouchStarted(current, payload, Date.now()));
            }
        },
        [commitTouchLocks],
    );
    const receiveTouchEnded = useCallback(
        (payload: TraceboardNodeTouchStartPayload | TraceboardNodeTouchEndPayload): void => {
            if ('userId' in payload) {
                commitTouchLocks((current) => releaseTraceboardNodeTouchLock(current, payload));
            }
        },
        [commitTouchLocks],
    );

    useEffect(() => {
        const touchChannel = channel();
        touchChannel.listenForWhisper('nodeTouchStarted', receiveTouchStarted);
        touchChannel.listenForWhisper('nodeTouchEnded', receiveTouchEnded);

        return () => {
            touchChannel.stopListeningForWhisper('nodeTouchStarted', receiveTouchStarted);
            touchChannel.stopListeningForWhisper('nodeTouchEnded', receiveTouchEnded);
        };
    }, [channel, receiveTouchEnded, receiveTouchStarted]);
}

function useTraceboardTouchLockHeartbeat(
    channel: () => TraceboardNodeTouchLockChannel,
    currentUser: User,
    localReasonsRef: MutableRefObject<LocalTouchLockReasonsByNode>,
    commitTouchLocks: CommitTouchLocks,
): void {
    useEffect(() => {
        const intervalId = setInterval(() => {
            renewLocalTouchLocks(channel(), currentUser, localReasonsRef.current, commitTouchLocks);
        }, TRACEBOARD_TOUCH_LOCK_HEARTBEAT_MS);

        return () => clearInterval(intervalId);
    }, [channel, commitTouchLocks, currentUser, localReasonsRef]);
}

function useTraceboardTouchLockCleanup(commitTouchLocks: CommitTouchLocks): void {
    useEffect(() => {
        const intervalId = setInterval(() => {
            commitTouchLocks((current) => removeStaleTraceboardNodeTouchLocks(current, Date.now()));
        }, TRACEBOARD_TOUCH_LOCK_CLEANUP_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [commitTouchLocks]);
}

function useTraceboardTouchLockUnmountRelease(
    channel: () => TraceboardNodeTouchLockChannel,
    currentUserId: number,
    localReasonsRef: MutableRefObject<LocalTouchLockReasonsByNode>,
    pendingDragReleasesRef: MutableRefObject<PendingDragReleaseTimersByNode>,
): void {
    useEffect(() => {
        const localReasons = localReasonsRef.current;
        const pendingDragReleases = pendingDragReleasesRef.current;

        return () => {
            const releaseNodeIds = touchLockReleaseNodeIds(localReasons, pendingDragReleases);
            clearPendingDragReleases(pendingDragReleases);
            whisperTouchLockReleases(channel(), currentUserId, releaseNodeIds);
        };
    }, [channel, currentUserId, localReasonsRef, pendingDragReleasesRef]);
}

function touchLockReleaseNodeIds(localReasons: LocalTouchLockReasonsByNode, pendingDragReleases: PendingDragReleaseTimersByNode): string[] {
    return Array.from(new Set([...Object.keys(localReasons), ...Object.keys(pendingDragReleases)]));
}

function whisperTouchLockReleases(channel: TraceboardNodeTouchLockChannel, currentUserId: number, nodeIds: string[]): void {
    nodeIds.forEach((nodeId) => {
        channel.whisper('nodeTouchEnded', { nodeId, userId: currentUserId });
    });
}

function whisperTraceboardTouchStarted(
    channel: TraceboardNodeTouchLockChannel,
    currentUser: User,
    nodeId: string,
    type: TraceboardNodeType,
    commitTouchLocks: CommitTouchLocks,
): void {
    const payload = createTraceboardTouchLockPayload(nodeId, type, currentUser, Date.now());
    commitTouchLocks((current) => receiveTraceboardNodeTouchStarted(current, payload, Date.now()));
    channel.whisper('nodeTouchStarted', payload);
}

function whisperTraceboardTouchEnded(
    channel: TraceboardNodeTouchLockChannel,
    currentUserId: number,
    nodeId: string,
    commitTouchLocks: CommitTouchLocks,
): void {
    const payload = { nodeId, userId: currentUserId };
    commitTouchLocks((current) => releaseTraceboardNodeTouchLock(current, payload));
    channel.whisper('nodeTouchEnded', payload);
}

function scheduleDragTouchLockRelease(
    channel: () => TraceboardNodeTouchLockChannel,
    currentUserId: number,
    localReasonsRef: MutableRefObject<LocalTouchLockReasonsByNode>,
    pendingDragReleasesRef: MutableRefObject<PendingDragReleaseTimersByNode>,
    nodeId: string,
    commitTouchLocks: CommitTouchLocks,
): void {
    clearPendingDragRelease(pendingDragReleasesRef.current, nodeId);
    pendingDragReleasesRef.current[nodeId] = setTimeout(() => {
        delete pendingDragReleasesRef.current[nodeId];
        releaseDelayedRemoteDragTouchLock(channel(), currentUserId, localReasonsRef.current, nodeId, commitTouchLocks);
    }, TRACEBOARD_TOUCH_LOCK_DRAG_RELEASE_DELAY_MS);
}

function releaseLocalDragTouchLock(
    currentUserId: number,
    localReasonsRef: MutableRefObject<LocalTouchLockReasonsByNode>,
    nodeId: string,
    commitTouchLocks: CommitTouchLocks,
): void {
    const pointerVersion = localReasonsRef.current[nodeId]?.reasonVersions.pointer;
    releaseLocalTouchLockReason(localReasonsRef.current, nodeId, 'drag');
    releaseMatchingLocalTouchLockReason(localReasonsRef.current, nodeId, 'pointer', pointerVersion);
    releaseLocalRenderedTouchLockIfIdle(currentUserId, localReasonsRef.current, nodeId, commitTouchLocks);
}

function releaseDelayedRemoteDragTouchLock(
    channel: TraceboardNodeTouchLockChannel,
    currentUserId: number,
    localReasons: LocalTouchLockReasonsByNode,
    nodeId: string,
    commitTouchLocks: CommitTouchLocks,
): void {
    if (hasLocalTouchLockReasons(localReasons, nodeId)) {
        return;
    }

    whisperTraceboardTouchEnded(channel, currentUserId, nodeId, commitTouchLocks);
}

function releaseLocalRenderedTouchLockIfIdle(
    currentUserId: number,
    localReasons: LocalTouchLockReasonsByNode,
    nodeId: string,
    commitTouchLocks: CommitTouchLocks,
): void {
    if (hasLocalTouchLockReasons(localReasons, nodeId)) {
        return;
    }

    releaseLocalRenderedTouchLock(currentUserId, nodeId, commitTouchLocks);
}

function releaseLocalRenderedTouchLock(currentUserId: number, nodeId: string, commitTouchLocks: CommitTouchLocks): void {
    commitTouchLocks((current) => releaseTraceboardNodeTouchLock(current, { nodeId, userId: currentUserId }));
}

function clearPendingDragRelease(pendingDragReleases: PendingDragReleaseTimersByNode, nodeId: string): void {
    const timeoutId = pendingDragReleases[nodeId];
    if (timeoutId === undefined) {
        return;
    }

    clearTimeout(timeoutId);
    delete pendingDragReleases[nodeId];
}

function hasPendingDragRelease(pendingDragReleases: PendingDragReleaseTimersByNode, nodeId: string): boolean {
    return pendingDragReleases[nodeId] !== undefined;
}

function clearPendingDragReleases(pendingDragReleases: PendingDragReleaseTimersByNode): void {
    const nodeIds = Object.keys(pendingDragReleases);

    nodeIds.forEach((nodeId) => clearPendingDragRelease(pendingDragReleases, nodeId));
}

function renewLocalTouchLocks(
    channel: TraceboardNodeTouchLockChannel,
    currentUser: User,
    localReasons: LocalTouchLockReasonsByNode,
    commitTouchLocks: CommitTouchLocks,
): void {
    Object.entries(localReasons).forEach(([nodeId, lock]) => {
        whisperTraceboardTouchStarted(channel, currentUser, nodeId, lock.type, commitTouchLocks);
    });
}

function storeLocalTouchLockReason(
    localReasons: LocalTouchLockReasonsByNode,
    nodeId: string,
    type: TraceboardNodeType,
    reason: TraceboardTouchLockReason,
    reasonVersion: number,
): void {
    localReasons[nodeId] = localReasons[nodeId] ?? { reasonVersions: {}, reasons: new Set(), type };
    localReasons[nodeId].reasonVersions[reason] = reasonVersion;
    localReasons[nodeId].reasons.add(reason);
}

function releaseMatchingLocalTouchLockReason(
    localReasons: LocalTouchLockReasonsByNode,
    nodeId: string,
    reason: TraceboardTouchLockReason,
    reasonVersion: number | undefined,
): void {
    if (reasonVersion === undefined || localReasons[nodeId]?.reasonVersions[reason] !== reasonVersion) {
        return;
    }

    releaseLocalTouchLockReason(localReasons, nodeId, reason);
}

function releaseLocalTouchLockReason(localReasons: LocalTouchLockReasonsByNode, nodeId: string, reason: TraceboardTouchLockReason): boolean {
    localReasons[nodeId]?.reasons.delete(reason);
    delete localReasons[nodeId]?.reasonVersions[reason];

    if (!localReasons[nodeId] || localReasons[nodeId].reasons.size === 0) {
        delete localReasons[nodeId];
        return false;
    }

    return true;
}

function hasLocalTouchLockReasons(localReasons: LocalTouchLockReasonsByNode, nodeId: string): boolean {
    const lock = localReasons[nodeId];

    return Boolean(lock && lock.reasons.size > 0);
}

function hasLocalTouchLockReason(localReasons: LocalTouchLockReasonsByNode, nodeId: string, reason: TraceboardTouchLockReason): boolean {
    const lock = localReasons[nodeId];

    return Boolean(lock?.reasons.has(reason));
}
