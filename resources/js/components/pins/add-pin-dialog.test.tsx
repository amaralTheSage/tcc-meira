import AddPinsDialog from '@/components/pins/add-pin-dialog';
import { buildPin } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('AddPinsDialog', () => {
    it('remounts from server props after creating a pin', async () => {
        const user = userEvent.setup();
        setMockPage({ url: '/project-1/pins' });

        render(
            <AddPinsDialog type="text" pins={[buildPin({ id: 'pin-existing', position: 1 })]}>
                <button type="button">New Text</button>
            </AddPinsDialog>,
        );
        await user.click(screen.getByText('New Text'));
        await user.type(screen.getByTestId('pin-text-input'), 'Ship checklist');
        await user.click(screen.getByTestId('pin-submit'));
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/pins',
            { position: 2, text: 'Ship checklist', type: 'text' },
            expect.objectContaining({
                preserveScroll: true,
                preserveState: 'errors',
            }),
        );
    });
});
