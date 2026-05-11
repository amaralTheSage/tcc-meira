import ProjectSwitcher from '@/components/project-switcher';
import { SidebarProvider } from '@/components/ui/sidebar';
import { buildProject } from '@/test/factories';
import { setMockPage } from '@/test/inertia';
import type { ProjectSwitcherProject } from '@/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('project switcher', () => {
    it('renders the current project and disables its option', async () => {
        const user = userEvent.setup();
        const projects = projectOptions();
        renderProjectSwitcher(projects, '/project-1/kanban');

        expect(screen.getByTestId('project-switcher-trigger')).toHaveTextContent('Roadmap');

        await user.click(screen.getByTestId('project-switcher-trigger'));

        expect(screen.getByTestId('project-switcher-option-project-1')).toHaveAttribute('data-disabled');
    });

    it('filters projects by title', async () => {
        const user = userEvent.setup();
        renderProjectSwitcher(projectOptions(), '/project-1/kanban');

        await user.click(screen.getByTestId('project-switcher-trigger'));
        await user.type(screen.getByLabelText('Search projects'), 'client');

        expect(screen.queryByTestId('project-switcher-option-project-1')).not.toBeInTheDocument();
        expect(screen.getByText('Client Portal')).toBeInTheDocument();
    });

    it('builds same-workspace links for other projects', async () => {
        const user = userEvent.setup();
        renderProjectSwitcher(projectOptions(), '/project-1/kanban');

        await user.click(screen.getByTestId('project-switcher-trigger'));

        expect(screen.getByTestId('project-switcher-option-project-2')).toHaveAttribute('href', '/project-2/kanban');
    });

    it('falls back docs detail URLs to another project docs index', async () => {
        const user = userEvent.setup();
        renderProjectSwitcher(projectOptions(), '/project-1/docs/document-1');

        await user.click(screen.getByTestId('project-switcher-trigger'));

        expect(screen.getByTestId('project-switcher-option-project-2')).toHaveAttribute('href', '/project-2/docs');
    });
});

function renderProjectSwitcher(projects: ProjectSwitcherProject[], url: string): void {
    setMockPage({ props: { projectSwitcher: { projects } }, url });

    render(
        <SidebarProvider>
            <ProjectSwitcher project={buildProject({ id: 'project-1', title: 'Roadmap' })} />
        </SidebarProvider>,
    );
}

function projectOptions(): ProjectSwitcherProject[] {
    return [
        { id: 'project-1', title: 'Roadmap' },
        { id: 'project-2', title: 'Client Portal' },
    ];
}
