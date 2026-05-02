import Kanban from '@/pages/template-visualizing/kanban';
import { buildColumn, buildSubtask, buildTask, buildTemplate, buildUser } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('template Kanban preview', () => {
    it('renders template tasks without edit controls', () => {
        const member = buildUser({ id: 7, name: 'Ada Lovelace' });
        const template = buildTemplate({
            id: 'template-1',
            name: 'Launch Template',
            data: {
                columns: [buildColumn({ id: 'column-backlog', name: 'Backlog', position: 0, type: 'backlog' })],
                pins: [],
                task_connections: [],
                tasks: [
                    {
                        ...buildTask({
                            description: 'Coordinate launch readiness',
                            id: 'task-launch',
                            subtasks: [buildSubtask({ id: 'subtask-1' })],
                            title: 'Launch checklist',
                            users: [member],
                        }),
                        column_id: 'missing-column',
                    },
                ],
            },
        });

        render(<Kanban template={template} />);

        expect(screen.getByTestId('template-kanban-board')).toBeInTheDocument();
        expect(within(screen.getByTestId('template-kanban-column-column-backlog')).getByText('Launch checklist')).toBeInTheDocument();
        expect(screen.getByText('Coordinate launch readiness')).toBeInTheDocument();
        expect(screen.getByText('AL')).toBeInTheDocument();
        expect(screen.getByText('1 subtasks')).toBeInTheDocument();
        expect(screen.queryByTestId('kanban-add-column')).not.toBeInTheDocument();
        expect(mockRouter.post).not.toHaveBeenCalled();
    });
});
