import type { EdgeTypeName } from '@/types/models';
import { addEdge, type Connection, type Edge, type Node } from '@xyflow/react';

export interface TraceboardConnectionChangedPayload {
    sourceId: string;
    targetId: string;
    connected: boolean;
    userId: number | string | null;
}

export interface TraceboardConnectionEdgeOptions {
    animatedEdges: boolean;
    edgeType: EdgeTypeName;
    nodes: Node[];
}

export interface TraceboardConnectionEndpoint {
    source: string;
    sourceHandle?: string | null;
    target: string;
    targetHandle?: string | null;
}

export type TraceboardPotentialConnection = Partial<Omit<Connection, 'source' | 'target'>> & {
    source?: string | null;
    target?: string | null;
};

/**
 * Checks whether React Flow supplied both connection endpoints.
 *
 * @example
 * if (isCompleteTraceboardConnection(connection)) connect(connection);
 */
export function isCompleteTraceboardConnection(connection: TraceboardPotentialConnection): connection is TraceboardConnectionEndpoint {
    return Boolean(connection.source && connection.target);
}

/**
 * Builds a Traceboard edge using current project edge settings.
 *
 * @example
 * const edge = traceboardConnectionEdge(connection, options);
 */
export function traceboardConnectionEdge(connection: TraceboardConnectionEndpoint, options: TraceboardConnectionEdgeOptions): Edge {
    return {
        ...connection,
        animated: traceboardConnectionShouldAnimate(connection.target, options),
        id: `${connection.source}-${connection.target}`,
        type: options.edgeType,
    };
}

/**
 * Applies a remote connection create/delete broadcast to local React Flow edges.
 *
 * @example
 * const nextEdges = applyTraceboardConnectionChanged(edges, payload, auth.user.id, options);
 */
export function applyTraceboardConnectionChanged(
    edges: Edge[],
    payload: TraceboardConnectionChangedPayload,
    currentUserId: number,
    options: TraceboardConnectionEdgeOptions,
): Edge[] {
    if (isOwnTraceboardConnectionChange(payload, currentUserId)) {
        return edges;
    }

    if (!payload.connected) {
        return removeTraceboardConnectionEdge(edges, payload);
    }

    return addEdge(traceboardConnectionEdge({ source: payload.sourceId, target: payload.targetId }, options), edges);
}

/**
 * Recomputes animated edge flags when node completion state changes.
 *
 * @example
 * const refreshed = refreshTraceboardConnectionAnimations(edges, options);
 */
export function refreshTraceboardConnectionAnimations(edges: Edge[], options: TraceboardConnectionEdgeOptions): Edge[] {
    let changed = false;
    const refreshedEdges = edges.map((edge) => {
        const animated = traceboardConnectionShouldAnimate(edge.target, options);

        if (edge.animated === animated) {
            return edge;
        }

        changed = true;
        return { ...edge, animated };
    });

    return changed ? refreshedEdges : edges;
}

function removeTraceboardConnectionEdge(edges: Edge[], payload: TraceboardConnectionChangedPayload): Edge[] {
    return edges.filter((edge) => edge.source !== payload.sourceId || edge.target !== payload.targetId);
}

function traceboardConnectionShouldAnimate(targetNodeId: string | null | undefined, options: TraceboardConnectionEdgeOptions): boolean {
    const targetNode = options.nodes.find((node) => node.id === targetNodeId);

    return options.animatedEdges && targetNode?.data.status !== 'completed';
}

function isOwnTraceboardConnectionChange(payload: TraceboardConnectionChangedPayload, currentUserId: number): boolean {
    if (payload.userId === null) {
        return false;
    }

    return String(payload.userId) === String(currentUserId);
}
