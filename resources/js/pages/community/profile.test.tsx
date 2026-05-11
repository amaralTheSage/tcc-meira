import Profile from '@/pages/community/profile';
import { buildUser } from '@/test/factories';
import { setMockPage } from '@/test/inertia';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('community profile', () => {
    it('does not render friendship actions or fake friend counts', () => {
        const profileUser = buildUser({ id: 7, name: 'Profile User' });
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) }, notifications: { items: [], unread_count: 0 } } });

        render(<Profile user={profileUser} />);

        expect(screen.getByText('Profile User')).toBeInTheDocument();
        expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();
        expect(screen.queryByText(/friends/i)).not.toBeInTheDocument();
    });
});
