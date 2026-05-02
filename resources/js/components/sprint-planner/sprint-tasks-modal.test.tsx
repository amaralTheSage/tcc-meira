import SprintTasksModal from '@/components/sprint-planner/sprint-tasks-modal';
import { buildTask } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('SprintTasksModal', () => {
    it('preselects sprint tasks and can save an empty task selection', async () => {
        const user = userEvent.setup();
        const assignedTask = buildTask({ id: 'task-1', sprint_id: 'sprint-1', title: 'Assigned task' });
        const unassignedTask = buildTask({ id: 'task-2', sprint_id: undefined, title: 'Unassigned task' });
        const onOpenChange = vi.fn();

        render(<SprintTasksModal open onOpenChange={onOpenChange} tasks={[assignedTask, unassignedTask]} sprintId="sprint-1" />);

        expect(screen.getByTestId('sprint-attach-tasks')).toBeDisabled();
        await user.click(screen.getByTestId('sprint-task-option-task-1'));
        await user.click(screen.getByTestId('sprint-attach-tasks'));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/sprints/sprint-1/attach-tasks',
            { task_ids: [] },
            expect.objectContaining({ preserveState: true }),
        );
    });
});
