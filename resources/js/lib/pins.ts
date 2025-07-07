export function getPinType(pin: Pinned): string {
    return pin.url ? 'link' : 'text';
}

export function getWebsiteName(url: string): string {
    try {
        const { hostname } = new URL(url);
        const parts = hostname.replace('www.', '').split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch (error) {
        return 'Unknown';
    }
}

import { Pinned } from '@/types/models';
import * as icons from 'simple-icons';

export function getWebsiteLogo(name: string): string | null {
    const normalizedName = name.toLowerCase().trim();

    const exactKey = Object.keys(icons).find((iconName) => iconName.toLowerCase() === normalizedName);
    if (exactKey) {
        return `data:image/svg+xml;base64,${btoa((icons as any)[exactKey].svg)}`;
    }

    const partialKey = Object.keys(icons).find(
        (iconName) => normalizedName.includes(iconName.toLowerCase()) || iconName.toLowerCase().includes(normalizedName),
    );
    if (partialKey) {
        return `data:image/svg+xml;base64,${btoa((icons as any)[partialKey].svg)}`;
    }

    return null;
}

export function getWebsiteNameFromUrl(url: string): string {
    try {
        const finalUrl = url.startsWith('http') ? url : 'https://' + url;
        const domain = new URL(finalUrl).hostname.replace('www.', '');
        const siteName = domain.split('.')[0];
        return siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {
        return 'Website';
    }
}

export function openAllLinks(pins: Pinned[]) {
    pins.forEach((pin) => {
        if (pin.url) {
            const finalUrl = pin.url.startsWith('http') ? pin.url : 'https://' + pin.url;
            window.open(finalUrl, '_blank');
        }
    });
}
