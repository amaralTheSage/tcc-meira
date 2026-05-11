import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { initializeTheme, useAppearance } from './use-appearance';
import { useIsMobile } from './use-mobile';
import { useMobileNavigation } from './use-mobile-navigation';

describe('browser API hooks', () => {
    it('locks explicit appearance changes to dark mode', async () => {
        const user = userEvent.setup();

        render(<AppearanceHarness />);
        await user.click(screen.getByRole('button', { name: 'light' }));

        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.documentElement).toHaveClass('dark');
    });

    it('overrides saved light preferences before React renders', () => {
        localStorage.setItem('appearance', 'light');

        initializeTheme();

        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.documentElement).toHaveClass('dark');
    });

    it('defaults to dark theme when no appearance preference exists', () => {
        initializeTheme();

        expect(document.documentElement).toHaveClass('dark');
    });

    it('tracks mobile viewport state from matchMedia-compatible browser APIs', () => {
        window.innerWidth = 500;

        render(<MobileHarness />);

        expect(screen.getByText('mobile')).toBeInTheDocument();
    });

    it('clears body pointer blocking after mobile navigation closes', async () => {
        document.body.style.pointerEvents = 'none';

        render(<MobileNavigationHarness />);
        fireEvent.click(screen.getByRole('button', { name: 'close' }));

        expect(document.body.style.pointerEvents).toBe('');
    });
});

function AppearanceHarness() {
    const { updateAppearance } = useAppearance();

    return <button onClick={() => updateAppearance('light')}>light</button>;
}

function MobileHarness() {
    const isMobile = useIsMobile();

    return <span>{isMobile ? 'mobile' : 'desktop'}</span>;
}

function MobileNavigationHarness() {
    const closeNavigation = useMobileNavigation();

    return <button onClick={closeNavigation}>close</button>;
}
