import NotificationPanel from '@/components/notification-panel';
import { SidebarProvider } from '@/components/ui/sidebar';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('notification panel', () => {
    it('uses the shared sidebar menu button collapse behavior', () => {
        render(
            <SidebarProvider>
                <NotificationPanel project_id="project-1" />
            </SidebarProvider>,
        );

        const trigger = screen.getByRole('button', { name: 'Notifications' });

        expect(trigger).toHaveAttribute('data-sidebar', 'menu-button');
        expect(trigger).toHaveClass('overflow-hidden');
        expect(trigger.className).toContain('group-data-[collapsible=icon]:size-8!');
    });

    it('hides its label when the sidebar collapses to icons', () => {
        render(
            <SidebarProvider defaultOpen={false}>
                <NotificationPanel project_id="project-1" />
            </SidebarProvider>,
        );

        expect(screen.getByText('Notifications')).toHaveClass('group-data-[collapsible=icon]:hidden');
        expect(screen.getByRole('button', { name: 'Notifications' })).toHaveClass('group-data-[collapsible=icon]:justify-center');
    });
});
