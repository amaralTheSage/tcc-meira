import { AddProjectDialog } from '@/components/home/add-project-dialog';
import { Button } from '@/components/ui/button';
import { buildUser } from '@/test/factories';
import { mockRouter } from '@/test/inertia';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('AddProjectDialog', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts selected invitees and lets the new project redirect replace the page', async () => {
        const user = userEvent.setup();
        const invitee = buildUser({ id: 42, name: 'Ada Lovelace' });
        const fetchUsers = vi.fn().mockResolvedValue({ json: async () => [invitee] });
        vi.stubGlobal('fetch', fetchUsers);

        renderDialog();

        await user.click(screen.getByRole('button', { name: 'New Project' }));
        await user.type(screen.getByLabelText('Project Title'), 'Compiler');
        await user.type(screen.getByPlaceholderText('Search by name or email'), 'ada');

        await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: 'Add' }));
        await user.click(screen.getByRole('button', { name: 'Create Project' }));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/projects',
            { title: 'Compiler', selectedUsers: [42] },
            expect.objectContaining({ preserveState: false }),
        );
    });

    it('does not fetch invitees before a user searches', async () => {
        const user = userEvent.setup();
        const fetchUsers = vi.fn();
        vi.stubGlobal('fetch', fetchUsers);

        renderDialog();

        await user.click(screen.getByRole('button', { name: 'New Project' }));

        expect(screen.getByPlaceholderText('Search by name or email')).toBeInTheDocument();
        expect(fetchUsers).not.toHaveBeenCalled();
    });

    it('searches users through JSON without navigating the home page', async () => {
        const user = userEvent.setup();
        const result = buildUser({ id: 7, name: 'Grace Hopper' });
        const fetchUsers = vi.fn().mockResolvedValue({ json: async () => [result] });
        vi.stubGlobal('fetch', fetchUsers);

        renderDialog();

        await user.click(screen.getByRole('button', { name: 'New Project' }));
        await user.type(screen.getByPlaceholderText('Search by name or email'), 'grace');

        await waitFor(() => expect(screen.getByText('Grace Hopper')).toBeInTheDocument());
        expect(fetchUsers).toHaveBeenCalledWith(expect.stringContaining('/search-users?search=grace'), expect.any(Object));
        expect(mockRouter.get).not.toHaveBeenCalled();
    });
});

function renderDialog(): void {
    render(
        <AddProjectDialog>
            <Button>New Project</Button>
        </AddProjectDialog>,
    );
}
