import type { EdgeTypeName, QueueOperation } from '@/types/models';
import { useEcho } from '@laravel/echo-react';
import {
    addEdge,
    useEdgesState,
    type Connection,
    type Edge,
    type IsValidConnection,
    type Node,
    type OnBeforeDelete,
    type OnEdgesChange,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import { isTraceboardConnectionRemoteLocked, isTraceboardNodeRemoteLocked, type TraceboardNodeTouchLocksByNode } from './traceboard-node-touch-locks';
import {
    applyTraceboardConnectionChanged,
    isCompleteTraceboardConnection,
    refreshTraceboardConnectionAnimations,
    traceboardConnectionEdge,
    type TraceboardConnectionChangedPayload,
    type TraceboardConnectionEdgeOptions,
} from './traceboard-connections';

interface UseTraceboardConnectionsOptions {
    animatedEdges: boolean;
    currentUserId: number;
    edgeType: EdgeTypeName;
    initialConnections: Edge[];
    nodeTouchLocks: TraceboardNodeTouchLocksByNode;
    nodes: Node[];
    queueOperation: QueueOperation;
}

interface TraceboardConnectionsState {
    edges: Edge[];
    isValidConnection: IsValidConnection;
    onBeforeDelete: OnBeforeDelete<Node, Edge>;
    onConnect: (connection: Connection) => void;
    onEdgesChange: OnEdgesChange<Edge>;
    onEdgesDelete: (edgesToDelete: Edge[]) => void;
}

type SetTraceboardEdges = Dispatch<SetStateAction<Edge[]>>;

/**
 * Owns Traceboard connection edge state and remote connection broadcasts.
 *
 * @example
 * const connections = useTraceboardConnections({ ...options });
 */
export function useTraceboardConnections(options: UseTraceboardConnectionsOptions): TraceboardConnectionsState {
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(options.initialConnections);
    const edgeOptions = useTraceboardConnectionEdgeOptions(options);
    const onConnect = useTraceboardConnectCallback(options, setEdges, edgeOptions);
    const onEdgesDelete = useTraceboardEdgeDeleteCallback(options);
    const onBeforeDelete = useTraceboardBeforeDeleteCallback(options);
    const isValidConnection = useTraceboardConnectionValidator(options);

    useTraceboardConnectionChangeListener(setEdges, edgeOptions, options.currentUserId);
    useTraceboardConnectionAnimationRefresh(setEdges, edgeOptions);

    return { edges, isValidConnection, onBeforeDelete, onConnect, onEdgesChange, onEdgesDelete };
}

function useTraceboardConnectionEdgeOptions(options: UseTraceboardConnectionsOptions): TraceboardConnectionEdgeOptions {
    return useMemo(
        () => ({ animatedEdges: options.animatedEdges, edgeType: options.edgeType, nodes: options.nodes }),
        [options.animatedEdges, options.edgeType, options.nodes],
    );
}

function useTraceboardConnectCallback(
    options: UseTraceboardConnectionsOptions,
    setEdges: SetTraceboardEdges,
    edgeOptions: TraceboardConnectionEdgeOptions,
): (connection: Connection) => void {
    const { currentUserId, nodeTouchLocks, queueOperation } = options;

    return useCallback(
        (connection: Connection): void => {
            if (!isCompleteTraceboardConnection(connection) || isTraceboardConnectionRemoteLocked(connection, nodeTouchLocks, currentUserId)) {
                return;
            }

            setEdges((prev) => addEdge(traceboardConnectionEdge(connection, edgeOptions), prev));
            queueOperation({ type: 'connect', task: {}, connection: { source_id: connection.source, target_id: connection.target } });
        },
        [currentUserId, edgeOptions, nodeTouchLocks, queueOperation, setEdges],
    );
}

function useTraceboardEdgeDeleteCallback(options: UseTraceboardConnectionsOptions): (edgesToDelete: Edge[]) => void {
    const { currentUserId, nodeTouchLocks, queueOperation } = options;

    return useCallback(
        (edgesToDelete: Edge[]): void => {
            edgesToDelete
                .filter((edge) => !isTraceboardConnectionRemoteLocked(edge, nodeTouchLocks, currentUserId))
                .forEach((edge) => {
                    queueOperation({ type: 'disconnect', task: {}, connection: { source_id: edge.source, target_id: edge.target } });
                });
        },
        [currentUserId, nodeTouchLocks, queueOperation],
    );
}

function useTraceboardBeforeDeleteCallback(options: UseTraceboardConnectionsOptions): OnBeforeDelete<Node, Edge> {
    const { currentUserId, nodeTouchLocks } = options;

    return useCallback<OnBeforeDelete<Node, Edge>>(
        async ({ nodes: nodesToDelete, edges: edgesToDelete }) => ({
            edges: edgesToDelete.filter((edge) => !isTraceboardConnectionRemoteLocked(edge, nodeTouchLocks, currentUserId)),
            nodes: nodesToDelete.filter((node) => !isTraceboardNodeRemoteLocked(nodeTouchLocks[node.id], currentUserId)),
        }),
        [currentUserId, nodeTouchLocks],
    );
}

function useTraceboardConnectionValidator(options: UseTraceboardConnectionsOptions): IsValidConnection {
    const { currentUserId, nodeTouchLocks } = options;

    return useCallback<IsValidConnection>(
        (connection) => !isTraceboardConnectionRemoteLocked(connection, nodeTouchLocks, currentUserId),
        [currentUserId, nodeTouchLocks],
    );
}

function useTraceboardConnectionChangeListener(
    setEdges: SetTraceboardEdges,
    edgeOptions: TraceboardConnectionEdgeOptions,
    currentUserId: number,
): void {
    const receiveConnectionChange = useCallback(
        (payload: TraceboardConnectionChangedPayload): void => {
            setEdges((current) => applyTraceboardConnectionChanged(current, payload, currentUserId, edgeOptions));
        },
        [currentUserId, edgeOptions, setEdges],
    );

    useEcho<TraceboardConnectionChangedPayload>('tasks', 'TaskConnectionChanged', receiveConnectionChange);
}

function useTraceboardConnectionAnimationRefresh(setEdges: SetTraceboardEdges, edgeOptions: TraceboardConnectionEdgeOptions): void {
    useEffect(() => {
        setEdges((current) => refreshTraceboardConnectionAnimations(current, edgeOptions));
    }, [edgeOptions, setEdges]);
}
