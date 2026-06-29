import {
    SprintBoardActions,
    SprintTimelineFeature,
    createSprintGanttFeature,
    createSprintKanbanTaskUrl,
    createSprintTraceboardUrl,
    sprintGanttRowHeight,
} from '@/components/sprint-planner/sprint-board';
import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import { buildSprint, buildTask } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
import type { ColumnTask, Sprint } from '@/types/models';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('SprintPlanning', () => {
    it('renders sprint controls for the Gantt sidebar row', async () => {
        const user = userEvent.setup();
        const sprint = buildSprint({ id: 'sprint-1', title: 'Sprint API' });
        const onComplete = vi.fn();
        const onDelete = vi.fn();
        const onEdit = vi.fn();
        const onSelectTasks = vi.fn();
        const onStart = vi.fn();

        render(
            <SprintBoardActions
                projectId="project-1"
                sprint={sprint}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onSelectTasks={onSelectTasks}
                onStart={onStart}
            />,
        );

        expect(screen.getByTestId('sprint-traceboard-sprint-1')).toHaveAttribute('href', '/project-1/traceboard?sprint=sprint-1');
        await user.click(screen.getByLabelText('Start sprint Sprint API'));
        await user.click(screen.getByLabelText('Select tasks for Sprint API'));
        await user.click(screen.getByLabelText('Edit sprint Sprint API'));
        await user.click(screen.getByLabelText('Delete sprint Sprint API'));

        expect(onStart).toHaveBeenCalledWith(sprint.id);
        expect(onSelectTasks).toHaveBeenCalledWith(sprint.id);
        expect(onEdit).toHaveBeenCalledWith(sprint);
        expect(onDelete).toHaveBeenCalledWith(sprint);
        expect(onComplete).not.toHaveBeenCalled();
    });

    it('builds traceboard links with the sprint search parameter', () => {
        expect(createSprintTraceboardUrl('project-1', 'sprint 1')).toBe('/project-1/traceboard?sprint=sprint%201');
    });

    it('builds Kanban links with the task search parameter', () => {
        expect(createSprintKanbanTaskUrl('project-1', 'task 1')).toBe('/project-1/kanban?task=task%201');
    });

    it('uses sprint colors for Gantt features', () => {
        const sprint = buildSprint({ color: '#9333ea', id: 'sprint-1', title: 'Sprint API' });

        expect(createSprintGanttFeature(sprint).status.color).toBe('#9333ea');
    });

    it('renders sprint timeline features with the sprint color', () => {
        const sprint = buildSprintWithTasks({ color: '#16a34a', id: 'sprint-1', title: 'Sprint API', tasks: [] });

        render(<SprintTimelineFeature feature={createSprintGanttFeature(sprint)} projectId="project-1" sprint={sprint} />);

        expect(screen.getByLabelText('Sprint timeline item Sprint API')).toHaveStyle({
            backgroundColor: '#16a34a',
            borderColor: '#16a34a',
        });
    });

    it('renders assigned tasks inside the sprint timeline feature', () => {
        const sprint = buildSprintWithTasks({
            id: 'sprint-1',
            tasks: [buildTask({ id: 'task-1', title: 'Wire realtime chat' }), buildTask({ id: 'task-2', title: 'Polish Kanban drag' })],
        });

        render(<SprintTimelineFeature feature={createSprintGanttFeature(sprint)} projectId="project-1" sprint={sprint} />);

        expect(screen.getByText('Wire realtime chat')).toBeInTheDocument();
        expect(screen.getByText('Polish Kanban drag')).toBeInTheDocument();
        expect(screen.getAllByRole('link')).toHaveLength(2);
        expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/project-1/kanban?task=task-1');
    });

    it('renders an empty task state for sprints without tasks', () => {
        const sprint = buildSprintWithTasks({ id: 'sprint-empty', tasks: [] });

        render(<SprintTimelineFeature feature={createSprintGanttFeature(sprint)} projectId="project-1" sprint={sprint} />);

        expect(screen.getByText('No tasks assigned')).toBeInTheDocument();
    });

    it('expands sprint Gantt rows as task count grows', () => {
        const emptySprint = buildSprintWithTasks({ tasks: [] });
        const taskSprint = buildSprintWithTasks({ tasks: [buildTask(), buildTask(), buildTask()] });

        expect(sprintGanttRowHeight(taskSprint)).toBeGreaterThan(sprintGanttRowHeight(emptySprint));
    });

    it('posts the selected sprint color when creating a sprint', async () => {
        const user = userEvent.setup();

        render(
            <SprintCreationDialog
                open
                onOpenChange={vi.fn()}
                onSubmit={vi.fn()}
                project_id="project-1"
                sprints={[buildSprint({ color: '#2563eb' })]}
            />,
        );

        expect(screen.getByTestId('sprint-color-input')).toHaveValue('#16a34a');
        await user.click(screen.getByTestId('sprint-color-option-#9333ea'));
        await user.click(screen.getByTestId('sprint-submit'));

        expect(mockRouter.post).toHaveBeenCalledWith('/project-1/sprint', expect.objectContaining({ color: '#9333ea' }), expect.any(Object));
    });

    it('patches the selected sprint color when editing a sprint', async () => {
        const user = userEvent.setup();
        const sprint = buildSprint({ id: 'sprint-1', color: '#dc2626', title: 'Sprint API' });

        render(<SprintCreationDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} project_id="project-1" sprint={sprint} sprints={[sprint]} />);

        await user.clear(screen.getByTestId('sprint-color-input'));
        await user.type(screen.getByTestId('sprint-color-input'), '#16a34a');
        await user.click(screen.getByTestId('sprint-submit'));

        expect(mockRouter.patch).toHaveBeenCalledWith(
            '/project-1/sprint/sprint-1',
            expect.objectContaining({ color: '#16a34a' }),
            expect.any(Object),
        );
    });
});

function buildSprintWithTasks(overrides: Partial<Sprint & { tasks: ColumnTask[] }> = {}): Sprint & { tasks: ColumnTask[] } {
    return buildSprint({ tasks: [], ...overrides }) as Sprint & { tasks: ColumnTask[] };
}
