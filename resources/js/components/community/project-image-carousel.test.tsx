import { ProjectImageCarousel } from '@/components/community/project-image-carousel';
import { CommunityPostPreview } from '@/types/models';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ProjectImageCarousel', () => {
    it('uses uploaded images when they exist', () => {
        render(<ProjectImageCarousel images={[{ url: '/storage/community/cover.png' }]} preview={preview()} title="Shared Roadmap" />);

        expect(screen.getByRole('img', { name: 'Shared Roadmap gallery 1' })).toHaveAttribute('src', '/storage/community/cover.png');
        expect(screen.queryByTestId('community-project-preview')).not.toBeInTheDocument();
    });

    it('uses the generated project preview when no images exist', () => {
        render(<ProjectImageCarousel images={[]} preview={preview()} title="Shared Roadmap" />);

        expect(screen.getByTestId('community-project-preview')).toBeInTheDocument();
        expect(screen.getByText('Research')).toBeInTheDocument();
    });
});

function preview(): CommunityPostPreview {
    return {
        animated_edges: true,
        edge_type: 'bezier',
        notes: [],
        tasks: [
            {
                id: 'task-1',
                sprint: { color: '#0891b2', id: 'sprint-1', title: 'Sprint teste' },
                status: 'pending',
                subtasks_completed: 3,
                subtasks_total: 5,
                target_ids: [],
                title: 'Research',
                x: 40,
                y: 90,
            },
        ],
    };
}
