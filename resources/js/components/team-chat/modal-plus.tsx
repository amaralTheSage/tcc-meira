import { type ChangeEvent, useRef } from 'react';

export default function ModalPlus({ onImageSelect }: { onImageSelect: (file: File) => void }) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    function triggerImageSelect(): void {
        fileInputRef.current?.click();
    }

    function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        if (!file) return;

        onImageSelect(file);
    }

    return (
        <div className="inline-grid grid-cols-2 gap-2.5 rounded-lg rounded-l-none border-l-2 border-solid border-neutral-500 p-3">
            <input
                data-testid="team-chat-image-input"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
            />
            <button
                data-testid="team-chat-image-trigger"
                type="button"
                className="fa-solid fa-image cursor-pointer hover:text-red-600"
                onClick={triggerImageSelect}
            ></button>
            <button type="button" className="fa-solid fa-paperclip cursor-pointer hover:text-red-600"></button>
        </div>
    );
}
