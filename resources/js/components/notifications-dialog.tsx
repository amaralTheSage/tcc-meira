import NotificationMenu from '@/components/notifications/notification-menu';

export function NotificationsDialog({ children }: { children?: React.ReactNode }) {
    return <NotificationMenu side="right">{children}</NotificationMenu>;
}
