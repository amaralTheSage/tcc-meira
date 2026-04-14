import NotificationMenu from '@/components/notifications/notification-menu';
import { ReactNode } from 'react';

export default function NotificationPanel({ children, project_id }: { children: ReactNode; project_id: string }) {
    void project_id;

    return (
        <NotificationMenu side="right" align="end" contentClassName="mb-4 ml-7 w-[28rem]">
            <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-sm text-neutral-600 hover:bg-sidebar-accent hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
                {children}
            </button>
        </NotificationMenu>
    );
}
