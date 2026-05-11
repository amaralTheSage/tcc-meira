import { emitEcho } from '@/test/echo';
import { act, renderHook } from '@testing-library/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import {
    applyTraceboardConnectionChanged,
    isCompleteTraceboardConnection,
    refreshTraceboardConnectionAnimations,
    traceboardConnectionEdge,
    type TraceboardConnectionChangedPayload,
    type TraceboardConnectionEdgeOptions,
} from './traceboard-connections';
import type { TraceboardNodeTouchLocksByNode } from './traceboard-node-touch-locks';
import { useTraceboardConnections } from './use-traceboard-connections';

describe('Traceboard connection helpers', () => {
    it('builds project-styled edges and disables animation for completed targets', () => {
        const edge = traceboardConnectionEdge({ source: 'source', target: 'target' }, connectionOptions([traceboardNode('target', 'completed')]));

        expect(edge).toMatchObject({
            animated: false,
            id: 'source-target',
            source: 'source',
            target: 'target',
            type: 'smoothstep',
        });
    });

    it('applies remote connection broadcasts and ignores the current user', () => {
        const options = connectionOptions([traceboardNode('target')]);
        const connected = applyTraceboardConnectionChanged([], connectionPayload(true, 8), 7, options);
        const unchanged = applyTraceboardConnectionChanged(connected, connectionPayload(false, 7), 7, options);
        const disconnected = applyTraceboardConnectionChanged(connected, connectionPayload(false, 8), 7, options);

        expect(connected).toHaveLength(1);
        expect(unchanged).toHaveLength(1);
        expect(disconnected).toHaveLength(0);
    });

    it('refreshes animation when the target task completion state changes', () => {
        const edge = traceboardConnectionEdge({ source: 'source', target: 'target' }, connectionOptions([traceboardNode('target')]));
        const refreshed = refreshTraceboardConnectionAnimations([edge], connectionOptions([traceboardNode('target', 'completed')]));

        expect(edge.animated).toBe(true);
        expect(refreshed[0].animated).toBe(false);
    });

    it('rejects incomplete React Flow connection payloads', () => {
        expect(isCompleteTraceboardConnection({ source: 'source', target: null })).toBe(false);
        expect(isCompleteTraceboardConnection({ source: 'source', target: 'target' })).toBe(true);
    });
});

describe('useTraceboardConnections', () => {
    it('shows remote connection broadcasts in local edge state', () => {
        const { result } = renderHook(() => useTraceboardConnectionsForTest({ nodes: [traceboardNode('target')] }));

        act(() => emitEcho('tasks', 'TaskConnectionChanged', { ...connectionPayload(true, 8) }));

        expect(result.current.edges).toHaveLength(1);
        expect(result.current.edges[0]).toMatchObject({ source: 'source', target: 'target' });
    });

    it('blocks local connects and disconnects that touch a remote-locked node', () => {
        const queueOperation = vi.fn();
        const { result } = renderHook(() =>
            useTraceboardConnectionsForTest({
                nodeTouchLocks: remoteNodeLock('source'),
                queueOperation,
            }),
        );

        act(() => result.current.onConnect(reactFlowConnection('source', 'target')));
        act(() => result.current.onEdgesDelete([traceboardEdge('source', 'target')]));

        expect(result.current.edges).toHaveLength(0);
        expect(queueOperation).not.toHaveBeenCalled();
    });
});

function useTraceboardConnectionsForTest(overrides: Partial<Parameters<typeof useTraceboardConnections>[0]> = {}): ReturnType<typeof useTraceboardConnections> {
    return useTraceboardConnections({
        animatedEdges: true,
        currentUserId: 7,
        edgeType: 'smoothstep',
        initialConnections: [],
        nodeTouchLocks: {},
        nodes: [traceboardNode('source'), traceboardNode('target')],
        queueOperation: vi.fn(),
        ...overrides,
    });
}

function connectionPayload(connected: boolean, userId: number): TraceboardConnectionChangedPayload {
    return {
        connected,
        sourceId: 'source',
        targetId: 'target',
        userId,
    };
}

function connectionOptions(nodes: Node[]): TraceboardConnectionEdgeOptions {
    return {
        animatedEdges: true,
        edgeType: 'smoothstep',
        nodes,
    };
}

function remoteNodeLock(nodeId: string): TraceboardNodeTouchLocksByNode {
    return {
        [nodeId]: {
            expiresAt: Date.now() + 1000,
            nodeId,
            type: 'Task',
            user: { avatar: null, id: 8, name: 'Remote user' },
        },
    };
}

function traceboardEdge(source: string, target: string): Edge {
    return {
        data: {},
        id: `${source}-${target}`,
        source,
        target,
    };
}

function reactFlowConnection(source: string, target: string): Connection {
    return {
        source,
        sourceHandle: null,
        target,
        targetHandle: null,
    };
}

function traceboardNode(id: string, status = 'pending'): Node {
    return {
        data: { status },
        id,
        position: { x: 0, y: 0 },
        type: 'Task',
    };
}
