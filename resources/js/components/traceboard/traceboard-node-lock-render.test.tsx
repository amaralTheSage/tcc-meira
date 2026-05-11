import { buildUser } from '@/test/factories';
import { render, screen } from '@testing-library/react';
import type { Node, NodeProps } from '@xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import Note, { type NoteNodeData } from './note';
import Task, { type TaskNodeData } from './task';
import type { TraceboardNodeTouchLock } from './traceboard-node-touch-locks';
import { traceboardUserAccentColor, traceboardUserAccentShadow } from './traceboard-user-colors';

vi.mock('@xyflow/react', async () => {
    const actual = await vi.importActual<typeof import('@xyflow/react')>('@xyflow/react');
    const react = await vi.importActual<typeof import('react')>('react');

    return {
        ...actual,
        Handle: ({ type }: { type: string }) => react.createElement('div', { 'data-testid': `handle-${type}` }),
        useReactFlow: () => ({ setNodes: vi.fn(), updateNode: vi.fn() }),
    };
});

describe('Traceboard node lock rendering', () => {
    it('shows user-colored task borders and the remote toucher avatar', () => {
        render(<Task {...taskProps({ touchLock: remoteLock('task-1'), touchLockIsRemote: true })} />);

        const lockColor = traceboardUserAccentColor(9);
        const avatar = screen.getByTestId('traceboard-lock-avatar-task-1').querySelector('[data-slot="avatar"]');
        expect(screen.getByTestId('traceboard-task-task-1')).toHaveStyle({
            borderColor: lockColor,
            boxShadow: traceboardUserAccentShadow(9),
        });
        expect(avatar).toHaveStyle({ borderColor: lockColor });
    });

    it('hides the current user avatar while keeping the local user-colored task border', () => {
        render(<Task {...taskProps({ touchLock: localLock('task-1'), touchLockIsLocal: true })} />);

        expect(screen.getByTestId('traceboard-task-task-1')).toHaveStyle({
            borderColor: traceboardUserAccentColor(7),
            boxShadow: traceboardUserAccentShadow(7),
        });
        expect(screen.queryByTestId('traceboard-lock-avatar-task-1')).not.toBeInTheDocument();
    });

    it('shows user-colored note borders and remote avatars', () => {
        render(<Note {...noteProps({ touchLock: remoteLock('note-1', 'Note'), touchLockIsRemote: true })} />);

        expect(screen.getByTestId('traceboard-note-note-1')).toHaveStyle({
            borderColor: traceboardUserAccentColor(9),
            boxShadow: traceboardUserAccentShadow(9),
        });
        expect(screen.getByTestId('traceboard-lock-avatar-note-1')).toBeInTheDocument();
    });
});

function taskProps(overrides: Partial<TaskNodeData>): NodeProps<Node<TaskNodeData, 'Task'>> {
    return {
        data: {
            id: 'task-1',
            members: [buildUser({ id: 1, name: 'Member One' })],
            queueOperation: vi.fn(),
            removePendingOpsForTask: vi.fn(),
            status: 'pending',
            title: 'Locked Task',
            x: 0,
            y: 0,
            ...overrides,
        },
        id: 'task-1',
        positionAbsoluteX: 0,
        positionAbsoluteY: 0,
        selected: false,
        type: 'Task',
    } as unknown as NodeProps<Node<TaskNodeData, 'Task'>>;
}

function noteProps(overrides: Partial<NoteNodeData>): NodeProps<Node<NoteNodeData, 'Note'>> {
    return {
        data: {
            DeleteNote: vi.fn(),
            UpdateNoteText: vi.fn(),
            text: 'Locked note',
            ...overrides,
        },
        id: 'note-1',
        positionAbsoluteX: 0,
        positionAbsoluteY: 0,
        selected: false,
        type: 'Note',
    } as unknown as NodeProps<Node<NoteNodeData, 'Note'>>;
}

function localLock(nodeId: string): TraceboardNodeTouchLock {
    return { expiresAt: 8000, nodeId, type: 'Task', user: { avatar: null, id: 7, name: 'Current User' } };
}

function remoteLock(nodeId: string, type: 'Task' | 'Note' = 'Task'): TraceboardNodeTouchLock {
    return { expiresAt: 8000, nodeId, type, user: { avatar: '/remote.png', id: 9, name: 'Remote User' } };
}
