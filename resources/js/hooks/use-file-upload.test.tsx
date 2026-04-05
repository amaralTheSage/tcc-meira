import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { formatBytes, useFileUpload, type FileWithPreview } from './use-file-upload';

describe('useFileUpload', () => {
    it('adds valid files and reports them through callbacks', () => {
        const onFilesChange = vi.fn();
        const onFilesAdded = vi.fn();
        const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
        const { result } = renderHook(() => useFileUpload({ accept: 'image/*', onFilesAdded, onFilesChange }));

        act(() => result.current[1].addFiles([file]));

        expect(result.current[0].files).toHaveLength(1);
        expect(result.current[0].files[0].file).toBe(file);
        expect(onFilesAdded).toHaveBeenCalledWith(expectFilesNamed(['avatar.png']));
        expect(onFilesChange).toHaveBeenCalledWith(expectFilesNamed(['avatar.png']));
    });

    it('keeps rejected files out of state with a useful error', () => {
        const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });
        const { result } = renderHook(() => useFileUpload({ accept: 'image/*', maxSize: 2 }));

        act(() => result.current[1].addFiles([file]));

        expect(result.current[0].files).toHaveLength(0);
        expect(result.current[0].errors[0]).toContain('maximum size');
    });

    it('replaces the previous file in single-file mode', () => {
        const firstFile = new File(['first'], 'first.png', { type: 'image/png' });
        const secondFile = new File(['second'], 'second.png', { type: 'image/png' });
        const { result } = renderHook(() => useFileUpload());

        act(() => result.current[1].addFiles([firstFile]));
        act(() => result.current[1].addFiles([secondFile]));

        expect(result.current[0].files).toHaveLength(1);
        expect(result.current[0].files[0].file.name).toBe('second.png');
    });

    it('formats byte counts with the existing compact suffix style', () => {
        expect(formatBytes(0)).toBe('0 Bytes');
        expect(formatBytes(1024)).toBe('1KB');
    });
});

function expectFilesNamed(names: string[]): FileWithPreview[] {
    return expect.arrayContaining(
        names.map((name) =>
            expect.objectContaining({
                file: expect.objectContaining({ name }),
            }),
        ),
    ) as FileWithPreview[];
}
