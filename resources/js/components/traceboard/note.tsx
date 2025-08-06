import { NodeProps, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import { useState } from 'react';

interface NoteNodeProps {
    id: string;
    data: {
        text?: string;
        DeleteNote: (id: string) => void;
        UpdateNoteText: (updateNode: () => any, text: string, id: string) => void;
    };
    height?: number;
    width?: number;
    position: { x: number; y: number };
}

export default function Note({ id, data: { text, DeleteNote, UpdateNoteText } }: NodeProps<NoteNodeProps>) {
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(text || '...');
    const { updateNode } = useReactFlow();

    const handleBlur = () => {
        setIsEditing(false);
        UpdateNoteText(updateNode, localText, id);
    };

    return (
        <div
            className="relative max-w-[400px] min-w-[200px] -rotate-1 transform cursor-move rounded-sm bg-yellow-200 p-3 pt-1.5 shadow-sm transition-transform hover:rotate-0"
            onDoubleClick={() => setIsEditing(true)}
        >
            <X size={18} className="absolute right-2 cursor-pointer" onClick={() => DeleteNote(id)} />
            {isEditing ? (
                <textarea
                    autoFocus
                    value={localText != '...' ? localText : ''}
                    placeholder={localText}
                    onChange={(e) => setLocalText(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleBlur();
                        }
                    }}
                    className="mt-[13px] w-full resize-none overflow-hidden bg-yellow-200 text-sm leading-relaxed outline-none"
                />
            ) : (
                <p className="mt-[13px] text-sm leading-relaxed">{localText}</p>
            )}
        </div>
    );
}
