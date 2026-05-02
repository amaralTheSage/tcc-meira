import ProjectMemberManager from '@/components/project-settings/member-manager';
import { buildProject, buildUser } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import type { ProjectInvitation } from '@/types/models';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('ProjectMemberManager', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('separates current members from pending invitations', () => {
        const { owner, member, pendingInvitation } = memberFixture();
        setAuthUser(owner);

        render(<ProjectMemberManager project={buildProject({ id: 'project-1', invitations: [pendingInvitation], members: [owner, member] })} />);

        expect(screen.getByText('Current members')).toBeInTheDocument();
        expect(screen.getByText('Pending invitations')).toBeInTheDocument();
        expect(screen.getByText('Pending invite')).toBeInTheDocument();
        expect(screen.queryByText('invite to the team')).not.toBeInTheDocument();
    });

    it('invites eligible search results through the project member endpoint', async () => {
        const user = userEvent.setup();
        const { owner, member } = memberFixture();
        const candidate = buildUser({ id: 9, name: 'Invite Candidate' });
        const fetchUsers = vi.fn().mockResolvedValue({ json: async () => [candidate] });
        vi.stubGlobal('fetch', fetchUsers);
        setAuthUser(owner);

        render(<ProjectMemberManager project={buildProject({ id: 'project-1', members: [owner, member] })} />);

        await user.type(screen.getByPlaceholderText('Search by name or email'), 'invite');
        await waitFor(() => expect(screen.getByText('Invite Candidate')).toBeInTheDocument());
        await user.click(screen.getByRole('button', { name: 'Invite' }));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/members/invitations',
            { user_id: 9 },
            expect.objectContaining({ preserveScroll: true }),
        );
    });

    it('confirms member removal through a shadcn alert dialog', async () => {
        const user = userEvent.setup();
        const { owner, member } = memberFixture();
        setAuthUser(owner);

        render(<ProjectMemberManager project={buildProject({ id: 'project-1', members: [owner, member] })} />);

        await user.click(screen.getByRole('button', { name: `Remove ${member.name}` }));
        expect(screen.getByRole('alertdialog', { name: 'Remove project member?' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Remove' }));

        expect(mockRouter.delete).toHaveBeenCalledWith('/project-1/members/2', expect.objectContaining({ preserveScroll: true }));
    });
});

function memberFixture(): { member: ReturnType<typeof buildUser>; owner: ReturnType<typeof buildUser>; pendingInvitation: ProjectInvitation } {
    const owner = buildUser({ id: 1, name: 'Owner User' });
    const member = buildUser({ id: 2, name: 'Member User' });
    const pendingUser = buildUser({ id: 3, name: 'Pending User' });

    return {
        member,
        owner,
        pendingInvitation: {
            id: 10,
            invitee: pendingUser,
            invitee_id: pendingUser.id,
            inviter_id: owner.id,
            project_id: 'project-1',
            status: 'pending',
        },
    };
}

function setAuthUser(user: ReturnType<typeof buildUser>): void {
    setMockPage({
        props: {
            auth: { user },
            notifications: { items: [], unread_count: 0 },
        },
    });
}
