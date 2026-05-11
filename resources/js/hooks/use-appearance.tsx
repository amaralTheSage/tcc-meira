import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light' | 'dark' | 'system';

const LOCKED_APPEARANCE: Appearance = 'dark';

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const setLocalAppearance = () => {
    if (typeof localStorage === 'undefined') {
        return;
    }

    localStorage.setItem('appearance', LOCKED_APPEARANCE);
};

const applyTheme = () => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
};

const persistLockedAppearance = () => {
    setLocalAppearance();
    setCookie('appearance', LOCKED_APPEARANCE);
    applyTheme();
};

export function initializeTheme() {
    persistLockedAppearance();
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(LOCKED_APPEARANCE);

    const updateAppearance = useCallback((_mode: Appearance) => {
        setAppearance(LOCKED_APPEARANCE);
        persistLockedAppearance();
    }, []);

    useEffect(() => {
        updateAppearance(LOCKED_APPEARANCE);
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
