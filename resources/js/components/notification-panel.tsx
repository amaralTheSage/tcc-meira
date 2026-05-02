import { Icon } from '@/components/icon';
import NotificationMenu from '@/components/notifications/notification-menu';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { Bell } from 'lucide-react';
import type { ReactElement } from 'react';

export default function NotificationPanel({ project_id }: { project_id: string }): ReactElement {
    void project_id;

    return (
        <NotificationMenu side="right" align="end" contentClassName="mb-4 ml-7 w-[28rem]">
            <SidebarMenuButton
                type="button"
                title="Notifications"
                className="text-neutral-600 group-data-[collapsible=icon]:justify-center hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
                <Icon iconNode={Bell} className="h-5 w-5" />
                <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">Notifications</span>
            </SidebarMenuButton>
        </NotificationMenu>
    );
}
