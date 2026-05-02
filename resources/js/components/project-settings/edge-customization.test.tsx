import EdgeCustomization from '@/components/project-settings/edge-customization';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/project-settings/canvas-preview', () => ({
    default: () => <div data-testid="canvas-preview" />,
}));

describe('EdgeCustomization', () => {
    it('separates the connection type label from the selector', () => {
        render(<EdgeCustomization initialType="bezier" initialAnimated={false} onChange={vi.fn()} />);

        expect(screen.getByText('Connection Type')).toHaveClass('block');
        expect(screen.getByRole('combobox', { name: 'Connection Type' })).toHaveClass('mt-1');
    });
});
