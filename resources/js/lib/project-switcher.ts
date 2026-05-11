import type { ProjectSwitcherProject } from '@/types';

const PROJECT_WORKSPACE_ROUTES: Record<string, string> = {
    docs: 'docs',
    kanban: 'kanban',
    pins: 'pins',
    'project-settings': 'project-settings',
    sprint: 'sprint.index',
    'team-chat': 'team-chat',
    traceboard: 'traceboard',
};

/**
 * Build the equivalent workspace URL for another project.
 *
 * Example: projectWorkspaceHref('project-2', '/project-1/kanban') returns '/project-2/kanban'.
 */
export function projectWorkspaceHref(projectId: string, currentUrl: string): string {
    const routeName = PROJECT_WORKSPACE_ROUTES[projectWorkspaceSegment(currentUrl)] ?? 'traceboard';

    return route(routeName, { project: projectId });
}

/**
 * Return the editable project workspace segment from an Inertia URL.
 *
 * Example: projectWorkspaceSegment('/project-1/docs/document-1') returns 'docs'.
 */
export function projectWorkspaceSegment(currentUrl: string): string {
    const pathSegments = new URL(currentUrl, 'http://meira.local').pathname.split('/').filter(Boolean);

    return pathSegments[1] ?? '';
}

/**
 * Filter project switcher options by case-insensitive title match.
 *
 * Example: filterProjectOptions(projects, 'road') returns projects named Roadmap.
 */
export function filterProjectOptions(projects: ProjectSwitcherProject[], query: string): ProjectSwitcherProject[] {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (normalizedQuery === '') {
        return projects;
    }

    return projects.filter((project) => project.title.toLocaleLowerCase().includes(normalizedQuery));
}
