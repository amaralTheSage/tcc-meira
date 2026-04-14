import KanbanBoard from '@/components/kanban/kanban-board';
import { buildColumn, buildProject, buildSprint, buildTag, buildTask, buildUser } from '@/test/factories';
import { emitEcho } from '@/test/echo';
import { mockRouter, setMockPage } from '@/test/inertia';
import type { Column } from '@/types/models';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

describe('KanbanBoard', () => {
    it('creates columns through the board action', async () => {
        const user = userEvent.setup();
        const project = buildProject({ id: 'project-1' });

        render(<KanbanHarness columns={[buildColumn({ id: 'column-1' })]} project={project} />);

        await user.click(screen.getByTestId('kanban-add-column'));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/kanban/column',
            { position: 2 },
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('filters tasks by member, tag, and sprint', async () => {
        const user = userEvent.setup();
        const member = buildUser({ id: 7, name: 'Grace Hopper' });
        const tag = buildTag({ id: 'tag-1', name: 'API' });
        const sprint = buildSprint({ id: 'sprint-1', title: 'Sprint API' });
        const project = buildProject({ id: 'project-1', members: [member], sprints: [sprint] });
        const visibleTask = buildTask({ id: 'task-visible', sprint_id: sprint.id, tags: [tag], title: 'Visible task', users: [member] });
        const hiddenTask = buildTask({ id: 'task-hidden', title: 'Hidden task', users: [] });

        render(<KanbanHarness columns={[buildColumn({ id: 'column-1', tasks: [visibleTask, hiddenTask] })]} project={project} />);

        await user.selectOptions(screen.getByTestId('kanban-filter-member'), String(member.id));
        await user.selectOptions(screen.getByTestId('kanban-filter-tag'), tag.id);
        await user.selectOptions(screen.getByTestId('kanban-filter-sprint'), sprint.id);

        expect(screen.getByText('Visible task')).toBeInTheDocument();
        expect(screen.queryByText('Hidden task')).not.toBeInTheDocument();
    });

    it('renames columns, deletes custom columns, and creates tasks', async () => {
        const user = userEvent.setup();
        const project = buildProject({ id: 'project-1' });
        const column = buildColumn({ id: 'column-1', name: 'Custom', type: 'standard' });

        render(<KanbanHarness columns={[column]} project={project} />);

        await user.click(screen.getByTestId('kanban-column-header-column-1'));
        await user.keyboard('{Control>}a{/Control}{Backspace}Ready{Enter}');
        await user.click(screen.getByTestId('kanban-add-task-column-1'));
        await user.type(screen.getByTestId('kanban-new-task-input-column-1'), 'Ship docs{Enter}');
        await user.click(within(screen.getByTestId('kanban-column-column-1')).getByTestId('kanban-column-delete-column-1'));

        expect(mockRouter.patch).toHaveBeenCalledWith(
            '/project-1/column/update/column-1',
            { name: 'Ready' },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/traceboard/tasks',
            expect.objectContaining({ column_id: 'column-1', title: 'Ship docs' }),
            expect.objectContaining({ preserveScroll: true }),
        );
        expect(mockRouter.delete).toHaveBeenCalledWith('/project-1/column/delete/column-1', expect.objectContaining({ onSuccess: expect.any(Function) }));
    });

    it('applies task assignment broadcasts without reloading columns', async () => {
        const user = userEvent.setup();
        const assignee = buildUser({ avatar: '/avatars/ada.png', id: 7, name: 'Ada Lovelace' });
        const project = buildProject({ id: 'project-1', members: [assignee] });
        const task = buildTask({ id: 'task-1', project_id: project.id, users: [] });

        render(<KanbanHarness columns={[buildColumn({ id: 'column-1', tasks: [task] })]} project={project} />);

        act(() => {
            emitEcho('tasks_users', 'TaskAssignedUser', {
                assigned: true,
                projectId: project.id,
                taskId: task.id,
                user: assignee,
            });
        });
        await user.click(screen.getByTestId('kanban-task-task-1'));

        expect(screen.getByText('1 member assigned')).toBeInTheDocument();
        expect(mockRouter.reload).not.toHaveBeenCalled();
    });

    it('creates subtasks without client ids and preserves state only for errors', async () => {
        const user = userEvent.setup();
        const project = buildProject({ id: 'project-1' });
        const task = buildTask({ id: 'task-1', project_id: project.id, subtasks: [] });

        render(<KanbanHarness columns={[buildColumn({ id: 'column-1', tasks: [task] })]} project={project} />);

        await user.click(screen.getByTestId('kanban-task-task-1'));
        await user.click(screen.getByTestId('kanban-add-subtask'));
        await user.type(screen.getByTestId('kanban-new-subtask-input'), 'Review copy{Enter}');

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/kanban/subtasks',
            { title: 'Review copy', position: 0, task_id: 'task-1' },
            expect.objectContaining({ preserveScroll: true, preserveState: 'errors' }),
        );
        expect(subtaskCreatePayload()).not.toHaveProperty('id');
    });
});

function KanbanHarness({ columns, project }: { columns: Column[]; project: ReturnType<typeof buildProject> }) {
    const [currentColumns, setColumn] = useState(columns);

    setMockPage({ url: `/${project.id}/kanban`, props: { project } });

    return <KanbanBoard columns={currentColumns} project={project} setColumn={setColumn} />;
}

function subtaskCreatePayload(): Record<string, unknown> {
    const call = mockRouter.post.mock.calls.find(([url]) => url === '/project-1/kanban/subtasks');

    return call?.[1] as Record<string, unknown>;
}
