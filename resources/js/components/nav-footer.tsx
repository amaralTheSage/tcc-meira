import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef } from 'react';
import NotificationPanel from './notification-panel';

export function NavFooter({
    items,
    className,
    children,
    project_id,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    project_id: string;
}) {
    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {/* Notifications Modal Button */}
                    <NotificationPanel project_id={project_id}>
                        {/* {tasks.length > 0 && (
                    <div className="relative cursor-pointer">
                        <Bell />
                        <div className="absolute top-0.5 right-0 size-2.5 rounded-full bg-red-400 shadow-md"></div>
                    </div>
                )} */}

                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                            >
                                {children}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </NotificationPanel>

                    {/* Other links */}
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
                            >
                                <a data-testid={`nav-${item.title.toLowerCase().replaceAll(' ', '-')}`} href={item.href} rel="noopener noreferrer">
                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
