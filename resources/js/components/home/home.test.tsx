import HomeProjectCard from '@/components/home/home-project-card';
import HomeUserMenu from '@/components/home/home-user-menu';
import TemplateListCard from '@/components/home/template-list-card';
import { buildProject, buildTemplate, buildUser } from '@/test/factories';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('home project workflows', () => {
    it('renders project cards with traceboard links', () => {
        const project = buildProject({ created_at: '2026-01-02T03:04:05.000Z', id: 'project-1', title: 'Roadmap' });

        render(<HomeProjectCard project={project} />);

        expect(screen.getByText('Roadmap')).toBeInTheDocument();
        expect(screen.getByTestId('home-project-card-project-1')).toHaveAttribute('href', '/project-1/traceboard');
    });

    it('renders member initials for quick project scanning', () => {
        const project = buildProject({
            id: 'project-2',
            members: [buildUser({ id: 4, name: 'Ada Lovelace' })],
            title: 'Compiler',
        });

        render(<HomeProjectCard project={project} />);

        expect(screen.getByText('AL')).toBeInTheDocument();
    });

    it('opens user settings options from the home config button', async () => {
        const user = userEvent.setup();

        render(<HomeUserMenu />);
        await user.click(screen.getByLabelText('Open user settings'));

        expect(screen.getByText('User Settings')).toBeInTheDocument();
        expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('links template view actions to template previews', () => {
        const template = buildTemplate({ id: 'template-1', name: 'Launch Template' });

        render(<TemplateListCard template={template} />);

        expect(screen.getByTestId('home-template-view-template-1')).toHaveAttribute('href', '/templates/template-1');
    });
});
