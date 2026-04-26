import { Pinned } from '@/types/models';

export function getPinType(pin: Pinned): string {
    const pinType = pin.url ? 'link' : 'text';

    return pinType;
}

export function getWebsiteName(url: string): string {
    try {
        const { hostname } = new URL(url);
        const parts = hostname.replace('www.', '').split('.');
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    } catch {
        return 'Unknown';
    }
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

export function openAllLinks(pins: Pinned[]): void {
    pins.forEach((pin) => {
        if (pin.url) {
            const finalUrl = pin.url.startsWith('http') ? pin.url : 'https://' + pin.url;
            window.open(finalUrl, '_blank');
        }
    });
}
