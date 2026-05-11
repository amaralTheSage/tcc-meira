import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ProjectUndoProvider } from '@/components/project-undo/project-undo-provider';
import { type BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    project,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[]; project: Project }>) {
    return (
        <ProjectUndoProvider project={project}>
            <AppShell variant="sidebar">
                <AppSidebar project={project} />
                <AppContent variant="sidebar" className="overflow-x-hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} project={project} />
                    {children}
                </AppContent>
            </AppShell>
        </ProjectUndoProvider>
    );
}
