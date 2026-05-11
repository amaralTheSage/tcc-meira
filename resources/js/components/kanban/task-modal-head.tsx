import { Column } from '@/types/models';
import { X } from 'lucide-react';

export default function ModalHeader({ closeModal, column }: { closeModal: React.Dispatch<React.SetStateAction<boolean>>; column?: Column }) {
    return (
        <div className="flex items-center justify-between border-b border-border/70 p-4">
            <h2 className="text-lg font-bold text-white">{column ? column.name || 'Untitled Column' : 'Task Details'}</h2>

            <button
                type="button"
                aria-label="Close task details"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => closeModal(false)}
            >
                <X className="size-4" />
            </button>
        </div>
    );
}
