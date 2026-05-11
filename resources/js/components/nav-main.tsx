import ProjectSwitcher from '@/components/project-switcher';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type ProjectSwitcherProject } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface NavMainProps {
    items: NavItem[];
    label?: string;
    project?: ProjectSwitcherProject;
}

export function NavMain({ items = [], label, project }: NavMainProps) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <NavMainProjectHeader label={label} project={project} />
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActiveNavHref(page.url, item.href)} tooltip={{ children: item.title }}>
                            <Link data-testid={`nav-${item.title.toLowerCase().replaceAll(' ', '-')}`} href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function NavMainProjectHeader({ label, project }: Pick<NavMainProps, 'label' | 'project'>) {
    if (project) {
        return <ProjectSwitcher project={project} />;
    }

    return label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null;
}

export function isActiveNavHref(currentUrl: string, itemHref: string): boolean {
    const currentPath = navPathname(currentUrl);
    const itemPath = navPathname(itemHref);

    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

function navPathname(url: string): string {
    const baseUrl = 'http://meira.local';
    const pathname = new URL(url, baseUrl).pathname.replace(/\/$/, '');

    return pathname || '/';
}
