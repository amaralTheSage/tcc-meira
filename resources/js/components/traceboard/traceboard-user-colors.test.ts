import { describe, expect, it } from 'vitest';
import { traceboardUserAccentColor, traceboardUserAccentShadow } from './traceboard-user-colors';

describe('Traceboard user accent colors', () => {
    it('derives stable visible colors from user ids', () => {
        expect(traceboardUserAccentColor(7)).toBe(traceboardUserAccentColor(7));
        expect(traceboardUserAccentColor(7)).not.toBe('#FFFFFF');
        expect(traceboardUserAccentColor(-7)).toBe(traceboardUserAccentColor(7));
    });

    it('builds the matching soft lock ring from the user color', () => {
        expect(traceboardUserAccentColor(8)).toBe('#b91c1c');
        expect(traceboardUserAccentShadow(8)).toBe('0 0 0 2px rgba(185, 28, 28, 0.22)');
    });
});
