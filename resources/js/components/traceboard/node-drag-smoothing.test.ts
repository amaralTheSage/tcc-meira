import type { Node } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import {
    advanceRemoteTraceboardNodeDragAnimations,
    applyRemoteTraceboardNodeDragAnimations,
    hasMovingRemoteTraceboardNodeDrags,
    receiveRemoteTraceboardNodeDragTarget,
    shouldReceiveRemoteTraceboardNodeDrag,
    type TraceboardNodeDragPayload,
} from './node-drag-smoothing';

describe('remote Traceboard node drag smoothing', () => {
    it('ignores the current user and accepts remote drags', () => {
        const localPayload = nodeDragPayload({ userId: '7' });
        const remotePayload = nodeDragPayload({ userId: 8 });
        const serverPayload = nodeDragPayload({ userId: null });

        expect(shouldReceiveRemoteTraceboardNodeDrag(localPayload, 7)).toBe(false);
        expect(shouldReceiveRemoteTraceboardNodeDrag(remotePayload, 7)).toBe(true);
        expect(shouldReceiveRemoteTraceboardNodeDrag(serverPayload, 7)).toBe(true);
    });

    it('animates remote task and note nodes from rendered positions', () => {
        const nodes = [traceboardNode('task-1', 'Task', 25, 10), traceboardNode('note-1', 'Note', 5, 5)];
        const target = receiveRemoteTraceboardNodeDragTarget({}, nodeDragPayload({ nodeId: 'task-1', x: 125, y: 10 }), nodes[0].position, 0);
        const halfway = advanceRemoteTraceboardNodeDragAnimations(target, 500);
        const renderedNodes = applyRemoteTraceboardNodeDragAnimations(nodes, halfway);

        expect(renderedNodes[0].position).toEqual({ x: 75, y: 10 });
        expect(renderedNodes[1].position).toEqual({ x: 5, y: 5 });
        expect(hasMovingRemoteTraceboardNodeDrags(halfway, 500)).toBe(true);
        expect(hasMovingRemoteTraceboardNodeDrags(halfway, 1000)).toBe(false);
    });
});

function nodeDragPayload(overrides: Partial<TraceboardNodeDragPayload> = {}): TraceboardNodeDragPayload {
    return {
        nodeId: 'task-1',
        type: 'Task',
        userId: 2,
        x: 100,
        y: 50,
        ...overrides,
    };
}

function traceboardNode(id: string, type: 'Task' | 'Note', x: number, y: number): Node {
    return {
        data: {},
        id,
        position: { x, y },
        type,
    };
}
