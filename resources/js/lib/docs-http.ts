export function csrfHeaders(): Record<string, string> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

    return token ? { 'X-CSRF-TOKEN': token } : {};
}

export function jsonHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...csrfHeaders(),
    };
}

export function formHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...csrfHeaders(),
    };
}
