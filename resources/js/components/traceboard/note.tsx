import { cn } from '@/lib/utils';
import { useEcho } from '@laravel/echo-react';
import { type Node, NodeProps, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import { type MouseEvent, type PointerEvent, useState } from 'react';
import { TraceboardNodeLockBadge } from './traceboard-node-lock-badge';
import type { TraceboardNodeLockData } from './traceboard-node-touch-locks';
import { traceboardUserAccentColor, traceboardUserAccentShadow } from './traceboard-user-colors';

type UpdateNodeFunction = (id: string, update: (node: Node) => Partial<Node>) => void;

export interface NoteNodeData extends TraceboardNodeLockData, Record<string, unknown> {
    text?: string;
    DeleteNote: (id: string) => void;
    UpdateNoteText: (updateNode: UpdateNodeFunction, text: string, id: string) => void;
}

type NoteNodeProps = Node<NoteNodeData, 'Note'>;

interface NoteRenamePayload {
    nodeId: string;
    type: 'Task' | 'Note';
    text: string;
}

export default function Note({
    id,
    data: { text, DeleteNote, UpdateNoteText, touchLock, touchLockIsLocal, touchLockIsRemote, startTouchLock, endTouchLock },
}: NodeProps<NoteNodeProps>) {
    const [isEditing, setIsEditing] = useState(false);
    const [localText, setLocalText] = useState(text || '...');
    const { updateNode } = useReactFlow();
    const lockStyle = touchLock
        ? {
              borderColor: traceboardUserAccentColor(touchLock.user.id),
              boxShadow: traceboardUserAccentShadow(touchLock.user.id),
          }
        : undefined;

    const handleBlur = () => {
        setIsEditing(false);
        endTouchLock?.(id, 'Note', 'editing');

        if (touchLockIsRemote) {
            return;
        }

        UpdateNoteText(updateNode, localText, id);
    };

    // Rename Text
    useEcho<NoteRenamePayload>('tasks', 'NodeRenamed', (e) => {
        if (e.type === 'Note' && id === e.nodeId) {
            setLocalText(e.text);
        }
    });

    function openEditing(): void {
        if (touchLockIsRemote) {
            return;
        }

        startTouchLock?.(id, 'Note', 'editing');
        setIsEditing(true);
    }

    function deleteNote(): void {
        if (touchLockIsRemote) {
            return;
        }

        DeleteNote(id);
    }

    function stopRemoteLockedPointer(event: MouseEvent<HTMLDivElement> | PointerEvent<HTMLDivElement>): void {
        if (!touchLockIsRemote) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
    }

    return (
        <div
            className={cn(
                'relative max-w-[400px] min-w-[200px] -rotate-1 transform cursor-move rounded-sm border border-transparent bg-yellow-200 p-3 pt-1.5 shadow-sm transition-[border-color,box-shadow,transform] hover:rotate-0',
            )}
            data-testid={`traceboard-note-${id}`}
            onContextMenuCapture={stopRemoteLockedPointer}
            onDoubleClick={openEditing}
            onPointerDownCapture={stopRemoteLockedPointer}
            style={lockStyle}
        >
            <TraceboardNodeLockBadge isLocal={touchLockIsLocal} lock={touchLock} />

            <X
                size={18}
                className={cn('absolute right-2 cursor-pointer', touchLockIsRemote && 'cursor-not-allowed opacity-40')}
                onClick={deleteNote}
            />
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
