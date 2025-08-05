import { NodeProps } from '@xyflow/react';
import { X } from 'lucide-react';

interface NoteNodeProps {
    id: string;
    data: { text?: string; DeleteNote: (id: string) => void };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Note({ id, data: { text, DeleteNote } }: NodeProps<NoteNodeProps>) {
    return (
        <div className="relative max-w-[400px] min-w-[200px] -rotate-1 transform cursor-move rounded-sm bg-yellow-200 p-3 pt-1.5 shadow-sm transition-transform hover:rotate-0">
            <X
                size={18}
                className="absolute right-2 cursor-pointer"
                onClick={() => {
                    DeleteNote(id);
                }}
            />
            <p className="mt-[13px] text-sm leading-relaxed">{text || 'lorem ipsum dolor amet ipsum lorem dorem olire pinto na cxuheo aiaiaia '}</p>
        </div>
    );
}
