import { buildPin } from '@/test/factories';
import { describe, expect, it, vi } from 'vitest';
import { getPinType, getWebsiteName, getWebsiteNameFromUrl, openAllLinks } from './pins';

describe('pin helpers', () => {
    it('identifies text and link pins from the url field', () => {
        expect(getPinType(buildPin({ text: 'Remember this', url: undefined }))).toBe('text');
        expect(getPinType(buildPin({ text: undefined, url: 'https://example.com' }))).toBe('link');
    });

    it('normalizes website names from absolute and shorthand urls', () => {
        expect(getWebsiteName('https://www.github.com/openai')).toBe('Github');
        expect(getWebsiteNameFromUrl('docs.example.com/page')).toBe('Docs');
        expect(getWebsiteName('not a url')).toBe('Unknown');
    });

    it('opens only link pins with browser-safe absolute urls', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        openAllLinks([
            buildPin({ id: 'text-pin', text: 'No link', url: undefined }),
            buildPin({ id: 'link-pin', text: undefined, url: 'example.com' }),
        ]);

        expect(openSpy).toHaveBeenCalledOnce();
        expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank');
    });
});
