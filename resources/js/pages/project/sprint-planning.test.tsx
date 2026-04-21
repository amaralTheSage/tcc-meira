import SprintCreationDialog from '@/components/sprint-planner/sprint-creation-dialog';
import { buildSprint } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('SprintPlanning', () => {
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
