import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { filterProjectOptions, projectWorkspaceHref } from '@/lib/project-switcher';
import type { ProjectSwitcherProject, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, FolderKanban, Search } from 'lucide-react';
import { useState } from 'react';

interface ProjectSwitcherProps {
    project: ProjectSwitcherProject;
}

export default function ProjectSwitcher({ project }: ProjectSwitcherProps) {
    const page = usePage<SharedData>();
    const [query, setQuery] = useState('');
    const projects = page.props.projectSwitcher.projects;
    const filteredProjects = filterProjectOptions(projects, query);

    return (
        <DropdownMenu onOpenChange={(open) => !open && setQuery('')}>
            <ProjectSwitcherTrigger title={project.title} />
            <ProjectSwitcherContent
                currentProjectId={project.id}
                currentUrl={page.url}
                projects={filteredProjects}
                query={query}
                onQueryChange={setQuery}
            />
        </DropdownMenu>
    );
}

function ProjectSwitcherTrigger({ title }: { title: string }) {
    return (
        <DropdownMenuTrigger asChild>
            <SidebarMenuButton
                data-testid="project-switcher-trigger"
                tooltip={{ children: 'Switch project' }}
                className="mb-1 h-10 border border-sidebar-border/70 bg-sidebar-accent/40"
            >
                <FolderKanban className="text-sidebar-foreground/70" />
                <span className="truncate font-medium">{title}</span>
                <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/55" />
            </SidebarMenuButton>
        </DropdownMenuTrigger>
    );
}

interface ProjectSwitcherContentProps {
    currentProjectId: string;
    currentUrl: string;
    projects: ProjectSwitcherProject[];
    query: string;
    onQueryChange: (query: string) => void;
}

function ProjectSwitcherContent({ currentProjectId, currentUrl, projects, query, onQueryChange }: ProjectSwitcherContentProps) {
    return (
        <DropdownMenuContent align="start" className="w-72 p-2">
            <ProjectSwitcherSearch query={query} onQueryChange={onQueryChange} />
            <ScrollArea className="mt-2 max-h-72">
                <div className="space-y-1 pr-2">
                    {projects.length === 0 ? (
                        <ProjectSwitcherEmpty />
                    ) : (
                        <ProjectSwitcherOptions projects={projects} currentProjectId={currentProjectId} currentUrl={currentUrl} />
                    )}
                </div>
            </ScrollArea>
        </DropdownMenuContent>
    );
}

function ProjectSwitcherSearch({ query, onQueryChange }: { query: string; onQueryChange: (query: string) => void }) {
    return (
        <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                aria-label="Search projects"
                className="h-9 pl-8"
                placeholder="Search projects"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
            />
        </div>
    );
}

function ProjectSwitcherOptions({ projects, currentProjectId, currentUrl }: Omit<ProjectSwitcherContentProps, 'query' | 'onQueryChange'>) {
    return (
        <>
            {projects.map((project) => (
                <ProjectSwitcherOption key={project.id} currentProjectId={currentProjectId} currentUrl={currentUrl} project={project} />
            ))}
        </>
    );
}

function ProjectSwitcherOption({
    currentProjectId,
    currentUrl,
    project,
}: {
    currentProjectId: string;
    currentUrl: string;
    project: ProjectSwitcherProject;
}) {
    if (project.id === currentProjectId) {
        return <CurrentProjectOption project={project} />;
    }

    return (
        <DropdownMenuItem asChild>
            <Link data-testid={`project-switcher-option-${project.id}`} href={projectWorkspaceHref(project.id, currentUrl)} prefetch>
                <FolderKanban />
                <span className="truncate">{project.title}</span>
            </Link>
        </DropdownMenuItem>
    );
}

function CurrentProjectOption({ project }: { project: ProjectSwitcherProject }) {
    return (
        <DropdownMenuItem disabled data-testid={`project-switcher-option-${project.id}`} className="font-medium">
            <Check />
            <span className="truncate">{project.title}</span>
        </DropdownMenuItem>
    );
}

function ProjectSwitcherEmpty() {
    const message = 'No projects found.';

    return <p className="px-2 py-6 text-center text-sm text-muted-foreground">{message}</p>;
}
