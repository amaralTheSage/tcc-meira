import {
    SprintBoardActions,
    SprintTimelineFeature,
    createSprintGanttFeature,
    createSprintTraceboardUrl,
} from '@/components/sprint-planner/sprint-board';
import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import { buildSprint } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
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

    it('uses sprint colors for Gantt features', () => {
        const sprint = buildSprint({ color: '#9333ea', id: 'sprint-1', title: 'Sprint API' });

        expect(createSprintGanttFeature(sprint).status.color).toBe('#9333ea');
    });

    it('renders sprint timeline features with the sprint color', () => {
        const sprint = buildSprint({ color: '#16a34a', id: 'sprint-1', title: 'Sprint API' });

        render(<SprintTimelineFeature feature={createSprintGanttFeature(sprint)} />);

        expect(screen.getByLabelText('Sprint timeline item Sprint API')).toHaveStyle({
            backgroundColor: '#16a34a',
            borderColor: '#16a34a',
        });
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
