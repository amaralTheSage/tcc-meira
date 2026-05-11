import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Project } from '@/types/models';
import { Link, useForm } from '@inertiajs/react';
import { BookOpenText, LayoutDashboard, Pin, SquareKanban } from 'lucide-react';

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
        {
            title: 'Docs',
            href: `/templates/${project.id}/docs`,
            icon: BookOpenText,
        },
    ];

    const form = useForm();

    return (
        <Sidebar collapsible="icon" variant="floating">
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
                <NavMain items={mainNavItems} label={project.title} />
            </SidebarContent>

            <SidebarFooter>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.post(route('project.apply_template', project.id));
                    }}
                >
                    <Button className="mb-8 w-full cursor-pointer bg-red-800 font-bold hover:bg-red-600" type="submit">
                        Use this Template
                    </Button>
                </form>
            </SidebarFooter>
        </Sidebar>
    );
}
