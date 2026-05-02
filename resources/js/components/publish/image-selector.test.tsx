import ImageSelector from '@/components/publish/image-selector';
import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

describe('ImageSelector', () => {
    it('does not resync unchanged files when the parent callback identity changes', async () => {
        const syncImages = vi.fn();

        render(<UnstableImageSelectorHarness syncImages={syncImages} />);

        await waitFor(() => expect(screen.getByTestId('sync-count')).toHaveTextContent('1'));
        expect(syncImages).toHaveBeenCalledTimes(1);
    });
});

function UnstableImageSelectorHarness({ syncImages }: { syncImages: () => void }) {
    const [syncCount, setSyncCount] = useState(0);

    const setImages = () => {
        syncImages();
        setSyncCount((count) => count + 1);
    };

    return (
        <>
            <span data-testid="sync-count">{syncCount}</span>
            <ImageSelector setData={setImages} />
        </>
    );
}
