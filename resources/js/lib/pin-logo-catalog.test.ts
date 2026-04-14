import { describe, expect, it } from 'vitest';
import { getPinnedWebsiteLogoDataUri } from './pin-logo-catalog';

const svgDataUriPrefix = 'data:image/svg+xml;charset=utf-8,';

describe('pin logo catalog', () => {
    it('returns a curated SVG data URI for known project websites', () => {
        const logoDataUri = getPinnedWebsiteLogoDataUri('GitHub');

        expect(logoDataUri).toContain(svgDataUriPrefix);
        expect(decodeURIComponent(logoDataUri?.replace(svgDataUriPrefix, '') ?? '')).toContain('<title>GitHub</title>');
    });

    it('normalizes spacing and casing before matching logos', () => {
        const logoDataUri = getPinnedWebsiteLogoDataUri('google drive');

        expect(decodeURIComponent(logoDataUri?.replace(svgDataUriPrefix, '') ?? '')).toContain('<title>Google Drive</title>');
    });

    it('returns null when a website is outside the curated set', () => {
        expect(getPinnedWebsiteLogoDataUri('unknown internal wiki')).toBeNull();
    });
});
