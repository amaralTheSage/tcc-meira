import { describe, expect, it } from 'vitest';
import { isActiveNavHref } from './nav-main';

describe('project navigation matching', () => {
    it('matches route paths when Ziggy returns absolute URLs', () => {
        expect(isActiveNavHref('/project-1/kanban', 'https://meira.test/project-1/kanban')).toBe(true);
    });

    it('matches nested routes without highlighting route siblings', () => {
        expect(isActiveNavHref('/project-1/docs/document-1', '/project-1/docs')).toBe(true);
        expect(isActiveNavHref('/project-1/kanban', '/project-1/kan')).toBe(false);
    });
});
