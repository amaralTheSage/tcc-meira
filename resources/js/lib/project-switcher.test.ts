import { filterProjectOptions, projectWorkspaceHref, projectWorkspaceSegment } from '@/lib/project-switcher';
import type { ProjectSwitcherProject } from '@/types';
import { describe, expect, it } from 'vitest';

describe('project switcher helpers', () => {
    it('builds same-workspace links for another project', () => {
        expect(projectWorkspaceHref('project-2', '/project-1/kanban')).toBe('/project-2/kanban');
        expect(projectWorkspaceHref('project-2', '/project-1/team-chat')).toBe('/project-2/team-chat');
    });

    it('falls back docs detail URLs to the target project docs index', () => {
        expect(projectWorkspaceHref('project-2', '/project-1/docs/document-1')).toBe('/project-2/docs');
    });

    it('falls back unknown project screens to traceboard', () => {
        expect(projectWorkspaceHref('project-2', '/project-1/unknown')).toBe('/project-2/traceboard');
    });

    it('extracts the workspace segment from relative Inertia URLs', () => {
        expect(projectWorkspaceSegment('/project-1/project-settings?tab=members')).toBe('project-settings');
    });

    it('filters project options by case-insensitive title', () => {
        const projects = projectOptions();

        expect(filterProjectOptions(projects, 'road')).toEqual([projects[0]]);
        expect(filterProjectOptions(projects, '   ')).toEqual(projects);
    });
});

function projectOptions(): ProjectSwitcherProject[] {
    return [
        { id: 'project-1', title: 'Roadmap' },
        { id: 'project-2', title: 'Client Portal' },
    ];
}
