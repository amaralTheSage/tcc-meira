import { describe, expect, it } from 'vitest';
import { inertiaPageModules } from './inertia-pages';

describe('inertiaPageModules', () => {
    it('keeps colocated page tests out of the production page map', () => {
        const pagePaths = Object.keys(inertiaPageModules);
        const testPagePaths = pagePaths.filter((pagePath) => pagePath.endsWith('.test.tsx'));

        expect(pagePaths).toContain('./pages/project/sprint-planning.tsx');
        expect(testPagePaths).toEqual([]);
    });
});
