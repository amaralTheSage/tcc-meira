import { ProjectUndoButton, ProjectUndoProvider, useProjectUndoFlusher } from '@/components/project-undo/project-undo-provider';
import { emitEcho } from '@/test/echo';
import { buildProject, buildUser } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('project undo provider', () => {
    beforeEach(() => {
        setProjectUndoPage(true);
    });

    it('flushes pending writes before posting undo', async () => {
        const order: string[] = [];
        const flusher = vi.fn(async () => {
            order.push('flush');
        });
        mockRouter.post.mockImplementation(() => order.push('post'));

        renderProjectUndo(<UndoHarness flusher={flusher} />);

        await userEvent.click(screen.getByLabelText('Undo Move task'));

        await waitFor(() => expect(mockRouter.post).toHaveBeenCalledWith('/project-1/undo', {}, expect.any(Object)));
        expect(order).toEqual(['flush', 'post']);
        expect(mockRouter.post.mock.calls[0][2]).toMatchObject({ preserveScroll: true, preserveState: false });
    });

    it('uses ctrl z outside editable fields', async () => {
        renderProjectUndo(<ProjectUndoButton />);

        await userEvent.keyboard('{Control>}z{/Control}');

        expect(mockRouter.post).toHaveBeenCalledWith('/project-1/undo', {}, expect.any(Object));
    });

    it('keeps native undo inside inputs', async () => {
        const user = userEvent.setup();
        renderProjectUndo(<input aria-label="Task title" />);

        await user.click(screen.getByLabelText('Task title'));
        await user.keyboard('{Control>}z{/Control}');

        expect(mockRouter.post).not.toHaveBeenCalled();
    });

    it('remounts project pages when another member undoes a board action', () => {
        renderProjectUndo(<ProjectUndoButton />);

        emitEcho('project-board', 'ProjectBoardRefreshed', { projectId: 'project-1', userId: 2 });

        expect(mockRouter.visit).toHaveBeenCalledWith('http://localhost/', {
            preserveScroll: true,
            preserveState: false,
            replace: true,
        });
    });
});

function UndoHarness({ flusher }: { flusher: () => Promise<void> }) {
    useProjectUndoFlusher(flusher);

    return <ProjectUndoButton />;
}

function renderProjectUndo(children: ReactNode): void {
    render(<ProjectUndoProvider project={buildProject({ id: 'project-1' })}>{children}</ProjectUndoProvider>);
}

function setProjectUndoPage(canUndo: boolean): void {
    setMockPage({
        props: {
            auth: { user: buildUser({ id: 1 }) },
            notifications: { items: [], unread_count: 0 },
            projectSwitcher: { projects: [] },
            projectUndo: { can_undo: canUndo, label: 'Move task' },
        },
        url: '/project-1/traceboard',
    });
}
