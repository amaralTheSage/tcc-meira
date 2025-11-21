import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, MessageSquareText, Pin, SquareKanban } from 'lucide-react';

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

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="floating">
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
                <NavMain items={mainNavItems} project={project.title} />
            </SidebarContent>

            <SidebarFooter>
                <Button className="mb-8 cursor-pointer bg-red-800 font-bold hover:bg-red-600">Use this Template</Button>
            </SidebarFooter>
        </Sidebar>
    );
}
