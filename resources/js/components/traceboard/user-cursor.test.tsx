import { render } from '@testing-library/react';
import type { Node, NodeProps } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { remoteTraceboardCursorColor } from './cursor-smoothing';
import UserCursor from './user-cursor';

describe('UserCursor', () => {
    it('renders a visible colored cursor with a contrast outline', () => {
        const { container } = render(<UserCursor {...userCursorProps({ color: '#1d4ed8' })} />);
        const cursorSvg = container.querySelector('svg');
        const cursorPath = container.querySelector('path');

        expect(cursorSvg).toHaveAttribute('fill', '#1d4ed8');
        expect(cursorSvg).toHaveStyle({ pointerEvents: 'none' });
        expect(cursorPath).toHaveAttribute('stroke', '#ffffff');
        expect(cursorPath).toHaveAttribute('stroke-width', '10');
        expect(cursorPath?.getAttribute('d')?.match(/M/g)).toHaveLength(1);
    });

    it('defaults to a high-contrast palette color instead of white', () => {
        const { container } = render(<UserCursor {...userCursorProps({})} />);
        const cursorSvg = container.querySelector('svg');

        expect(cursorSvg).toHaveAttribute('fill', remoteTraceboardCursorColor(0));
        expect(cursorSvg).not.toHaveAttribute('fill', '#FFFFFF');
    });
});

function userCursorProps(data: { color?: string }): NodeProps<Node<{ color?: string }, 'UserCursor'>> {
    return {
        data,
        deletable: false,
        draggable: false,
        dragging: false,
        dragHandle: undefined,
        height: 24,
        id: 'remote-cursor:7',
        isConnectable: false,
        parentId: undefined,
        positionAbsoluteX: 0,
        positionAbsoluteY: 0,
        selectable: false,
        selected: false,
        sourcePosition: undefined,
        targetPosition: undefined,
        type: 'UserCursor',
        width: 24,
        zIndex: 0,
    } as unknown as NodeProps<Node<{ color?: string }, 'UserCursor'>>;
}
