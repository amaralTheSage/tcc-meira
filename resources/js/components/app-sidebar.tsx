import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Bell, Globe, LayoutDashboard, MessageSquareText, Pin, Settings, SquareKanban } from 'lucide-react';
import AppLogo from './app-logo';
import { Icon } from './icon';

export function AppSidebar({ project }: { project: Project }) {
    const mainNavItems: NavItem[] = [
        {
            title: 'Pins',
            href: route('pins', { project: project.id }),
            icon: Pin,
        },
        {
            title: 'Traceboard',
            href: route('traceboard', { project: project.id }),
            icon: LayoutDashboard,
        },
        {
            title: 'Kanban',
            href: route('kanban', { project: project.id }),
            icon: SquareKanban,
        },
        {
            title: 'Chat',
            href: route('team-chat', { project: project.id }),
            icon: MessageSquareText,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Project Settings',
            href: route('project-settings', { project: project.id }),
            icon: Settings,
        },
        {
            title: 'Community',
            href: route('community.index'),
            icon: Globe,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto">
                    <div className="cursor-pointer">
                        <Icon iconNode={Bell} className="h-5 w-5" />
                        <span>Notifications</span>
                    </div>
                </NavFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
