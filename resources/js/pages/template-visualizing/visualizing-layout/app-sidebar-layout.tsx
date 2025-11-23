import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { type PropsWithChildren } from 'react';
import { AppSidebar } from './app-sidebar';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    project,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; project: Project }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar project={project} />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
