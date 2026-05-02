import type { CSSProperties } from 'react';

export const SPRINT_COLOR_FALLBACK = '#2563eb';

export const SPRINT_COLOR_PALETTE = [
    '#2563eb',
    '#16a34a',
    '#dc2626',
    '#9333ea',
    '#ea580c',
    '#0891b2',
    '#be123c',
    '#4f46e5',
] as const;

const SPRINT_HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function normalizeSprintHexColor(color?: string | null): string {
    const trimmedColor = color?.trim();

    if (!trimmedColor || !SPRINT_HEX_COLOR_PATTERN.test(trimmedColor)) {
        return SPRINT_COLOR_FALLBACK;
    }

    return trimmedColor.toLowerCase();
}

export function firstUnusedSprintColor(colors: Array<string | null | undefined>): string {
    const usedColors = new Set(colors.map((color) => normalizeSprintHexColor(color)));

    return SPRINT_COLOR_PALETTE.find((color) => !usedColors.has(color)) ?? SPRINT_COLOR_FALLBACK;
}

export function sprintColorReadableText(color?: string | null): string {
    const { red, green, blue } = sprintRgbFromHex(normalizeSprintHexColor(color));
    const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

    return luminance > 0.6 ? '#0f172a' : '#ffffff';
}

export function sprintBadgeStyle(color?: string | null): CSSProperties {
    const normalizedColor = normalizeSprintHexColor(color);

    return {
        backgroundColor: normalizedColor,
        borderColor: normalizedColor,
        color: sprintColorReadableText(normalizedColor),
    };
}

export function sprintTintStyle(color?: string | null): CSSProperties {
    const normalizedColor = normalizeSprintHexColor(color);
    const { red, green, blue } = sprintRgbFromHex(normalizedColor);

    return {
        backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.16)`,
        borderColor: `rgba(${red}, ${green}, ${blue}, 0.42)`,
        color: normalizedColor,
    };
}

export function sprintAccentStyle(color?: string | null): CSSProperties {
    return {
        backgroundColor: normalizeSprintHexColor(color),
    };
}

function sprintRgbFromHex(color: string): { blue: number; green: number; red: number } {
    const hexColor = normalizeSprintHexColor(color).slice(1);

    return {
        red: Number.parseInt(hexColor.slice(0, 2), 16),
        green: Number.parseInt(hexColor.slice(2, 4), 16),
        blue: Number.parseInt(hexColor.slice(4, 6), 16),
    };
}
