import Traceboard from '@/pages/project/traceboard';
import { buildProject, buildSprint } from '@/test/factories';
import type { TraceboardTask } from '@/types/models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/traceboard/board', () => ({
    default: ({ tasks }: { tasks?: TraceboardTask[] }) => (
        <div data-testid="traceboard-board">
            {tasks?.map((task) => (
                <span key={task.id}>{task.title}</span>
            ))}
        </div>
    ),
}));

describe('Traceboard page', () => {
    it('filters tasks with a shadcn sprint selector', async () => {
        const user = userEvent.setup();
        window.history.replaceState(null, '', '/project-1/traceboard');
        const sprint = buildSprint({ color: '#dc2626', id: 'sprint-1', title: 'Sprint API' });
        const visibleTask = buildTraceboardTask({ id: 'task-visible', sprint_id: sprint.id, title: 'Visible task' });
        const hiddenTask = buildTraceboardTask({ id: 'task-hidden', title: 'Hidden task' });
        const project = buildProject({ id: 'project-1', sprints: [sprint], tasks: [visibleTask, hiddenTask] });

        render(<Traceboard project={project} />);

        expect(screen.getByTestId('traceboard-sprint-filter')).toHaveAttribute('data-slot', 'select-trigger');
        await user.click(screen.getByTestId('traceboard-sprint-filter'));
        const sprintOption = await screen.findByRole('option', { name: sprint.title });
        expect(screen.getByTestId('traceboard-sprint-color-sprint-1')).toHaveStyle({ backgroundColor: '#dc2626' });
        await user.click(sprintOption);

        expect(screen.getByText('Visible task')).toBeInTheDocument();
        expect(screen.queryByText('Hidden task')).not.toBeInTheDocument();
    });

    it('initializes the sprint filter from the traceboard search parameter', () => {
        window.history.replaceState(null, '', '/project-1/traceboard?sprint=sprint-1');
        const sprint = buildSprint({ id: 'sprint-1', title: 'Sprint API' });
        const visibleTask = buildTraceboardTask({ id: 'task-visible', sprint_id: sprint.id, title: 'Visible task' });
        const hiddenTask = buildTraceboardTask({ id: 'task-hidden', title: 'Hidden task' });
        const project = buildProject({ id: 'project-1', sprints: [sprint], tasks: [visibleTask, hiddenTask] });

        render(<Traceboard project={project} />);

        expect(screen.getByText('Visible task')).toBeInTheDocument();
        expect(screen.queryByText('Hidden task')).not.toBeInTheDocument();
    });
});

function buildTraceboardTask(overrides: Partial<TraceboardTask> = {}): TraceboardTask {
    return {
        id: 'task-1',
        queueOperation: vi.fn(),
        removePendingOpsForTask: vi.fn(),
        status: 'pending',
        title: 'Traceboard task',
        x: 0,
        y: 0,
        ...overrides,
    };
}
