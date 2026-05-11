import { Image, Paperclip } from 'lucide-react';
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
        <div className="absolute bottom-full left-0 mb-2 inline-grid grid-cols-2 gap-2 rounded-md border border-border/70 bg-popover p-2 shadow-lg shadow-black/30">
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
                className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={triggerImageSelect}
            >
                <Image className="size-4" />
            </button>
            <button
                type="button"
                className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
                <Paperclip className="size-4" />
            </button>
        </div>
    );
}
