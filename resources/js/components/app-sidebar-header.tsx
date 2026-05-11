import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProjectUndoButton } from '@/components/project-undo/project-undo-provider';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import type { Project } from '@/types/models';

export function AppSidebarHeader({ breadcrumbs = [], project }: { breadcrumbs?: BreadcrumbItemType[]; project?: Project }) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {project && <ProjectUndoButton />}
        </header>
    );
}
