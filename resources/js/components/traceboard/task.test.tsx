import { SprintBadge } from '@/components/sprint-badge';
import { buildSprint } from '@/test/factories';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SprintBadge', () => {
    it('renders sprint metadata as a quiet tinted traceboard chip', () => {
        const sprint = buildSprint({ color: '#9333ea', title: 'Design Review' });

        render(<SprintBadge sprint={sprint} />);

        const badge = screen.getByLabelText('Sprint Design Review');
        expect(badge).toHaveClass('rounded-md', 'text-foreground/90');
        expect(badge).toHaveStyle({
            backgroundColor: 'rgba(147, 51, 234, 0.16)',
            borderColor: 'rgba(147, 51, 234, 0.42)',
        });
        expect(badge.children).toHaveLength(2);
        expect(screen.getByText('Design Review')).toBeInTheDocument();
    });
});
