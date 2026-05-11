import { echo, echoIsConfigured } from '@laravel/echo-react';

export function csrfHeaders(): Record<string, string> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;

    return token ? { 'X-CSRF-TOKEN': token } : {};
}

export function socketHeaders(): Record<string, string> {
    if (!echoIsConfigured()) return {};

    const socketId = echo().socketId();

    return socketId ? { 'X-Socket-Id': socketId } : {};
}

export function jsonHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...csrfHeaders(),
        ...socketHeaders(),
    };
}

export function formHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...csrfHeaders(),
        ...socketHeaders(),
    };
}
