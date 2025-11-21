import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, Pin, SquareKanban } from 'lucide-react';

export function AppSidebar({ project }: { project: Project }) {
    const mainNavItems: NavItem[] = [
        {
            title: 'Pins',
            href: `/templates/${project.id}/pins`,
            icon: Pin,
        },
        {
            title: 'Traceboard',
            href: `/templates/${project.id}/traceboard`,
            icon: LayoutDashboard,
        },
        {
            title: 'Kanban',
            href: `/templates/${project.id}/kanban`,
            icon: SquareKanban,
        },
    ];

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
