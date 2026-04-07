import NotificationMenu from '@/components/notifications/notification-menu';
import { emitEcho } from '@/test/echo';
import { buildUser } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import type { AppNotification } from '@/types';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('notification menu', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    });

    it('renders persisted notifications and accepts project invites', async () => {
        const user = userEvent.setup();
        const notification = buildNotification({ type: 'project_invite' });
        setMockPage({
            props: {
                auth: { user: buildUser({ id: 1 }) },
                notifications: { items: [notification], unread_count: 1 },
            },
        });

        render(<NotificationMenu />);

        await user.click(screen.getByLabelText('Open notifications'));
        await user.click(screen.getByText('Accept'));

        expect(fetch).toHaveBeenCalledWith('/notifications/notification-1/read', expect.objectContaining({ method: 'PATCH' }));
        expect(mockRouter.post).toHaveBeenCalledWith('/project-invitations/invitation-1/accept', {}, { preserveScroll: true });
    });

    it('prepends Reverb notifications to the open menu', async () => {
        const user = userEvent.setup();
        setMockPage({
            props: {
                auth: { user: buildUser({ id: 1 }) },
                notifications: { items: [], unread_count: 0 },
            },
        });

        render(<NotificationMenu />);
        await user.click(screen.getByLabelText('Open notifications'));

        act(() => {
            emitNotification(buildNotification({ id: 'notification-2', message: 'Ada mentioned you.' }));
        });

        expect(screen.getByText('Ada mentioned you.')).toBeInTheDocument();
    });
});

function emitNotification(notification: AppNotification): void {
    emitEcho('App.Models.User.1', 'notification', notification as unknown as Record<string, unknown>);
}

function buildNotification(overrides: Partial<AppNotification> = {}): AppNotification {
    return {
        action_label: 'View invitation',
        action_url: '/home',
        actor: { id: 2, name: 'Ada Lovelace', avatar: null },
        context: { invitation: { id: 'invitation-1', status: 'pending' } },
        created_at: '2026-01-01T10:00:00.000Z',
        id: 'notification-1',
        message: 'Ada invited you to join Meira.',
        project: { id: 'project-1', title: 'Meira' },
        read_at: null,
        subject: {},
        type: 'project_invite',
        ...overrides,
    };
}
