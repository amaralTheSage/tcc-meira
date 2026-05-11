import FeedPostCard from '@/components/community/feed-post-card';
import { buildUser } from '@/test/factories';
import { CommunityPost } from '@/types/models';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('FeedPostCard', () => {
    it('renders uploaded community images before generated previews', () => {
        render(
            <ul>
                <FeedPostCard post={communityPost({ images: [{ url: '/storage/community/cover.png' }] })} />
            </ul>,
        );

        expect(screen.getByRole('img', { name: 'Shared Roadmap' })).toHaveAttribute('src', '/storage/community/cover.png');
        expect(screen.queryByTestId('community-project-preview')).not.toBeInTheDocument();
    });

    it('renders a generated project preview when no images are uploaded', () => {
        render(
            <ul>
                <FeedPostCard post={communityPost()} />
            </ul>,
        );

        expect(screen.getByTestId('community-project-preview')).toBeInTheDocument();
        expect(screen.getByText('Design launch')).toBeInTheDocument();
    });
});

function communityPost(overrides: Partial<CommunityPost> = {}): CommunityPost {
    return {
        description: 'A public workflow',
        images: [],
        members: [buildUser({ name: 'Ada Lovelace' })],
        preview: {
            animated_edges: true,
            edge_type: 'bezier',
            notes: [{ id: 'note-1', text: 'Launch notes', x: 200, y: 180 }],
            tasks: [
                {
                    id: 'task-1',
                    sprint: { color: '#0891b2', id: 'sprint-1', title: 'Sprint teste' },
                    status: 'pending',
                    subtasks_completed: 3,
                    subtasks_total: 5,
                    target_ids: ['task-2'],
                    title: 'Design launch',
                    x: 0,
                    y: 0,
                },
                {
                    id: 'task-2',
                    sprint: { color: '#0891b2', id: 'sprint-1', title: 'Sprint teste' },
                    status: 'completed',
                    subtasks_completed: 5,
                    subtasks_total: 5,
                    target_ids: [],
                    title: 'Ship launch',
                    x: 520,
                    y: 180,
                },
            ],
        },
        public_views_count: 0,
        title: 'Shared Roadmap',
        ...overrides,
    };
}
