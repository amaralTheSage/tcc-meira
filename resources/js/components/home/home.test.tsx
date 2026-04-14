import HomeProjectCard from '@/components/home/home-project-card';
import { buildProject, buildUser } from '@/test/factories';
import { render, screen } from '@testing-library/react';
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
});
