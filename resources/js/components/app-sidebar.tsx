import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { BookOpenText, CalendarCheck2, Globe, LayoutDashboard, MessageSquareText, Pin, Settings2, SquareKanban } from 'lucide-react';
import AppLogo from './app-logo';

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
            title: 'Sprint',
            href: route('sprint.index', { project: project.id }),
            icon: CalendarCheck2,
        },
        {
            title: 'Chat',
            href: route('team-chat', { project: project.id }),
            icon: MessageSquareText,
        },
        {
            title: 'Docs',
            href: route('docs', { project: project.id }),
            icon: BookOpenText,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Project Settings',
            href: route('project-settings', { project: project.id }),
            icon: Settings2,
        },
        {
            title: 'Community',
            href: route('community.feed'),
            icon: Globe,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={route('home')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} project={project} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" project_id={project.id} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
