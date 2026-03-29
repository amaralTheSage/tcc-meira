export default function ModalPlus({ onImageSelect }: { onImageSelect: (file: File) => void }) {
    const handleImageClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                onImageSelect(file);
            }
        };
        input.click();
    };

    return (
        <div className="inline-grid grid-cols-2 gap-2.5 rounded-lg rounded-l-none border-l-2 border-solid border-neutral-500 p-3">
            <button type="button" className="fa-solid fa-image cursor-pointer hover:text-red-600" onClick={handleImageClick}></button>
            <button type="button" className="fa-solid fa-paperclip cursor-pointer hover:text-red-600"></button>
        </div>
    );
}
