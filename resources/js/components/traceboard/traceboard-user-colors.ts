export const TRACEBOARD_USER_ACCENT_PALETTE = ['#b91c1c', '#1d4ed8', '#047857', '#7c3aed', '#c2410c', '#be185d', '#0f766e', '#4338ca'];

/**
 * Picks a deterministic high-contrast Traceboard collaboration color.
 *
 * @example
 * const color = traceboardUserAccentColor(7);
 */
export function traceboardUserAccentColor(userId: number): string {
    const paletteIndex = Math.abs(userId) % TRACEBOARD_USER_ACCENT_PALETTE.length;

    return TRACEBOARD_USER_ACCENT_PALETTE[paletteIndex];
}

/**
 * Builds the shared Traceboard collaboration focus ring for a user.
 *
 * @example
 * const shadow = traceboardUserAccentShadow(7);
 */
export function traceboardUserAccentShadow(userId: number): string {
    const color = traceboardUserAccentColor(userId);
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);

    return `0 0 0 2px rgba(${red}, ${green}, ${blue}, 0.22)`;
}
