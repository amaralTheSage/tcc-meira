import ConfirmDeletionDialog from '@/components/project-settings/confirm-deletion-dialog';
import SharingControls from '@/components/project-settings/sharing-controls';
import { buildProject } from '@/test/factories';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('project settings action buttons', () => {
    it('uses high contrast text on the publishing action', () => {
        render(<SharingControls project={buildProject({ id: 'project-1', visibility: 'private' })} />);

        expect(screen.getByRole('button', { name: 'Save Visibility' })).toHaveClass('bg-destructive', 'text-white');
    });

    it('renders public sharing fields without looping image synchronization', () => {
        render(<SharingControls project={buildProject({ id: 'project-1', visibility: 'public' })} />);

        expect(screen.getByLabelText('Community Title')).toBeInTheDocument();
    });

    it('uses high contrast text on the delete trigger', () => {
        render(<ConfirmDeletionDialog id="project-1" />);

        expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-destructive', 'text-white');
    });
});
