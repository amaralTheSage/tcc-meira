import {
    SPRINT_COLOR_FALLBACK,
    firstUnusedSprintColor,
    normalizeSprintHexColor,
    sprintAccentStyle,
    sprintBadgeStyle,
    sprintColorReadableText,
    sprintTintStyle,
} from '@/lib/sprint-colors';
import { describe, expect, it } from 'vitest';

describe('sprint color helpers', () => {
    it('normalizes valid hex colors and falls back for invalid values', () => {
        expect(normalizeSprintHexColor(' #ABCDEF ')).toBe('#abcdef');
        expect(normalizeSprintHexColor('blue')).toBe(SPRINT_COLOR_FALLBACK);
        expect(normalizeSprintHexColor(null)).toBe(SPRINT_COLOR_FALLBACK);
    });

    it('selects the first unused palette color', () => {
        expect(firstUnusedSprintColor(['#2563eb'])).toBe('#16a34a');
        expect(firstUnusedSprintColor(['not-a-color'])).toBe('#16a34a');
    });

    it('returns readable text and reusable style objects', () => {
        expect(sprintColorReadableText('#ffffff')).toBe('#0f172a');
        expect(sprintColorReadableText('#000000')).toBe('#ffffff');
        expect(sprintBadgeStyle('#ffffff')).toMatchObject({ backgroundColor: '#ffffff', color: '#0f172a' });
        expect(sprintTintStyle('#2563eb')).toMatchObject({ color: '#2563eb' });
        expect(sprintAccentStyle('#2563eb')).toEqual({ backgroundColor: '#2563eb' });
    });
});
