import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import type { AppNotification, SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { Bell, CheckCheck, MailOpen, X } from 'lucide-react';
import { ReactElement, ReactNode, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationMenuProps {
    children?: ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
    contentClassName?: string;
}

export default function NotificationMenu({
    children,
    side = 'bottom',
    align = 'end',
    contentClassName = 'w-[24rem]',
}: NotificationMenuProps): ReactElement {
    const { auth, notifications } = usePage<SharedData>().props;
    const [items, setItems] = useState<AppNotification[]>(notifications.items);
    const [unreadCount, setUnreadCount] = useState<number>(notifications.unread_count);
    const channelName = `App.Models.User.${auth.user.id}`;

    const receiveNotification = useCallback((notification: AppNotification): void => {
        setItems((currentItems) => prependNotification(currentItems, notification));
        setUnreadCount((currentCount) => currentCount + (notification.read_at ? 0 : 1));
        toast.success(notification.message);
    }, []);

    useEffect(() => {
        setItems(notifications.items);
        setUnreadCount(notifications.unread_count);
    }, [notifications.items, notifications.unread_count]);

    useEchoNotification<AppNotification>(channelName, receiveNotification, undefined, [channelName]);

    function markRead(notification: AppNotification): void {
        if (notification.read_at) {
            return;
        }

        setItems((currentItems) => markItemRead(currentItems, notification.id));
        setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
        sendNotificationRequest(route('notifications.read', { notification: notification.id }), 'PATCH');
    }

    function markAllRead(): void {
        setItems((currentItems) => currentItems.map(withReadTimestamp));
        setUnreadCount(0);
        sendNotificationRequest(route('notifications.read-all'), 'PATCH');
    }

    function dismissNotification(notification: AppNotification): void {
        removeVisibleNotification(notification);
        sendNotificationRequest(route('notifications.dismiss', { notification: notification.id }), 'DELETE');
    }

    function removeVisibleNotification(notification: AppNotification): void {
        setItems((currentItems) => removeNotification(currentItems, notification.id));
        setUnreadCount((currentCount) => (notification.read_at ? currentCount : Math.max(0, currentCount - 1)));
    }

    return (
        <Popover>
            <NotificationMenuTrigger unreadCount={unreadCount}>{children}</NotificationMenuTrigger>
            <PopoverContent side={side} align={align} className={`${contentClassName} p-0`}>
                <NotificationMenuHeader unreadCount={unreadCount} markAllRead={markAllRead} />
                <ScrollArea type="always" className="max-h-[28rem]">
                    {items.length === 0 ? (
                        <EmptyNotificationState />
                    ) : (
                        <ul className="divide-y">
                            {items.map((notification) => (
                                <NotificationMenuItem
                                    key={notification.id}
                                    notification={notification}
                                    markRead={markRead}
                                    dismissNotification={dismissNotification}
                                    removeVisibleNotification={removeVisibleNotification}
                                />
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

function NotificationMenuTrigger({ children, unreadCount }: { children?: ReactNode; unreadCount: number }): ReactElement {
    if (children) {
        return <PopoverTrigger asChild>{children}</PopoverTrigger>;
    }

    return (
        <PopoverTrigger className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'relative' })} aria-label="Open notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && <UnreadDot />}
        </PopoverTrigger>
    );
}

function NotificationMenuHeader({ unreadCount, markAllRead }: { unreadCount: number; markAllRead: () => void }): ReactElement {
    return (
        <div className="flex items-center justify-between border-b p-4">
            <div>
                <h3 className="text-sm font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2" onClick={markAllRead} disabled={unreadCount === 0}>
                <CheckCheck className="h-4 w-4" />
                Mark all
            </Button>
        </div>
    );
}

function NotificationMenuItem({
    notification,
    dismissNotification,
    markRead,
    removeVisibleNotification,
}: {
    notification: AppNotification;
    dismissNotification: (notification: AppNotification) => void;
    markRead: (notification: AppNotification) => void;
    removeVisibleNotification: (notification: AppNotification) => void;
}): ReactElement {
    const getInitials = useInitials();

    return (
        <li className={`p-4 transition-colors hover:bg-muted/50 ${notification.read_at ? '' : 'bg-muted/30'}`}>
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={notification.actor.avatar ?? undefined} alt={notification.actor.name} />
                    <AvatarFallback>{getInitials(notification.actor.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                    <div>
                        <p className="text-sm leading-snug">{notification.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{relativeTime(notification.created_at)}</p>
                    </div>
                    <NotificationActions notification={notification} markRead={markRead} removeVisibleNotification={removeVisibleNotification} />
                </div>
                <div className="flex flex-shrink-0 items-start gap-2">
                    {!notification.read_at && <span className="mt-2 h-2 w-2 rounded-full bg-red-500" />}
                    <DismissNotificationButton notification={notification} dismissNotification={dismissNotification} />
                </div>
            </div>
        </li>
    );
}

function NotificationActions({
    notification,
    markRead,
    removeVisibleNotification,
}: {
    notification: AppNotification;
    markRead: (notification: AppNotification) => void;
    removeVisibleNotification: (notification: AppNotification) => void;
}): ReactElement {
    if (notification.type === 'project_invite' && notification.context?.invitation) {
        return <InvitationActions notification={notification} removeVisibleNotification={removeVisibleNotification} />;
    }

    return (
        <Button asChild size="sm" className="h-8 px-3 text-xs" onClick={() => markRead(notification)}>
            <Link href={notification.action_url}>{notification.action_label}</Link>
        </Button>
    );
}

function InvitationActions({
    notification,
    removeVisibleNotification,
}: {
    notification: AppNotification;
    removeVisibleNotification: (notification: AppNotification) => void;
}): ReactElement | null {
    const invitationId = notification.context?.invitation?.id;

    if (!invitationId) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            <Button size="sm" className="h-8 px-3 text-xs" onClick={() => acceptInvitation(invitationId, notification, removeVisibleNotification)}>
                Accept
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => declineInvitation(invitationId, notification, removeVisibleNotification)}
            >
                Decline
            </Button>
        </div>
    );
}

function DismissNotificationButton({
    notification,
    dismissNotification,
}: {
    notification: AppNotification;
    dismissNotification: (notification: AppNotification) => void;
}): ReactElement {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Dismiss notification"
                    onClick={() => dismissNotification(notification)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Dismiss</TooltipContent>
        </Tooltip>
    );
}

function EmptyNotificationState(): ReactElement {
    return (
        <div className="p-8 text-center text-muted-foreground">
            <MailOpen className="mx-auto mb-3 h-10 w-10 opacity-60" />
            <p className="text-sm">No notifications</p>
        </div>
    );
}

function UnreadDot(): ReactElement {
    return <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />;
}

function acceptInvitation(
    invitationId: string,
    notification: AppNotification,
    removeVisibleNotification: (notification: AppNotification) => void,
): void {
    removeVisibleNotification(notification);
    router.post(route('project-invitations.accept', { invitation: invitationId }), { notification_id: notification.id }, { preserveScroll: true });
}

function declineInvitation(
    invitationId: string,
    notification: AppNotification,
    removeVisibleNotification: (notification: AppNotification) => void,
): void {
    removeVisibleNotification(notification);
    router.post(route('project-invitations.decline', { invitation: invitationId }), { notification_id: notification.id }, { preserveScroll: true });
}

function prependNotification(items: AppNotification[], notification: AppNotification): AppNotification[] {
    const normalizedNotification = normalizeNotification(notification);
    const remainingItems = items.filter((item) => item.id !== normalizedNotification.id);

    return [normalizedNotification, ...remainingItems].slice(0, 30);
}

function removeNotification(items: AppNotification[], notificationId: string): AppNotification[] {
    return items.filter((item) => item.id !== notificationId);
}

function normalizeNotification(notification: AppNotification): AppNotification {
    return {
        ...notification,
        created_at: notification.created_at ?? new Date().toISOString(),
        read_at: notification.read_at ?? null,
    };
}

function markItemRead(items: AppNotification[], notificationId: string): AppNotification[] {
    return items.map((item) => (item.id === notificationId ? withReadTimestamp(item) : item));
}

function withReadTimestamp(notification: AppNotification): AppNotification {
    return {
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
    };
}

function sendNotificationRequest(url: string, method: 'DELETE' | 'PATCH'): void {
    void fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': csrfToken(),
        },
        method,
    }).catch(() => toast.error('Unable to update notification.'));
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function relativeTime(value?: string | null): string {
    if (!value) {
        return 'just now';
    }

    const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);

    if (Math.abs(minutes) < 1) {
        return 'just now';
    }

    if (Math.abs(hours) < 1) {
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(minutes, 'minute');
    }

    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(hours, 'hour');
}
