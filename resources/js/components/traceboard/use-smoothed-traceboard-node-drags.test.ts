import { emitEcho } from '@/test/echo';
import { act, renderHook } from '@testing-library/react';
import type { Node } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { useSmoothedTraceboardNodeDrags } from './use-smoothed-traceboard-node-drags';

describe('useSmoothedTraceboardNodeDrags', () => {
    it('does not update nodes for the current user drag broadcast', () => {
        const updateTraceboardNodes = vi.fn();

        renderHook(() => useSmoothedTraceboardNodeDrags(7, [], updateTraceboardNodes));

        act(() => {
            emitEcho('tasks', 'NodeDragged', {
                nodeId: 'task-1',
                type: 'Task',
                userId: 7,
                x: 100,
                y: 50,
            });
        });

        expect(updateTraceboardNodes).not.toHaveBeenCalled();
    });

    it('queues a remote node drag animation from the current rendered node', () => {
        let nodes = [traceboardNode('task-1', 20, 10)];
        const updateTraceboardNodes = vi.fn((nextNodes: Node[]) => {
            nodes = nextNodes;
        });

        renderHook(() => useSmoothedTraceboardNodeDrags(7, nodes, updateTraceboardNodes));

        act(() => {
            emitEcho('tasks', 'NodeDragged', {
                nodeId: 'task-1',
                type: 'Task',
                userId: 8,
                x: 100,
                y: 50,
            });
        });

        expect(updateTraceboardNodes).toHaveBeenCalledTimes(1);
        expect(nodes[0].position).toEqual({ x: 20, y: 10 });
    });
});

function traceboardNode(id: string, x: number, y: number): Node {
    return {
        data: {},
        id,
        position: { x, y },
        type: 'Task',
    };
}
