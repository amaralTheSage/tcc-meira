import { Card, CardContent } from '@/components/ui/card';
import type { Pinned } from '@/types/models';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pin } from 'lucide-react';
import { IndividualPinContextMenu } from './individual-pin-context-menu';

export default function PinnedText({
    pin,
    pins,
    setPins,
    allowToDrag = true,
}: {
    pin: Pinned;
    pins: Pinned[];
    setPins: React.Dispatch<React.SetStateAction<Pinned[]>>;
    allowToDrag?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pin.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`col-span-2 ${isDragging ? 'z-50' : ''}`}>
            <IndividualPinContextMenu pins={pins} id={pin.id} setPins={setPins}>
                <Card className="group border-2 border-dashed border-border/50 py-3 transition-colors hover:bg-accent/50">
                    <CardContent className="px-4">
                        <div className="flex gap-3">
                            <Pin className="h-4.5 w-4.5 -rotate-12 text-muted-foreground" />
                            <div className="flex-1 space-y-2 pr-6">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="flex-1 text-sm leading-relaxed text-foreground">{pin.text}</p>
                                </div>
                            </div>

                            {/* Drag Handle */}

                            {allowToDrag && (
                                <div
                                    {...attributes}
                                    {...listeners}
                                    className="my-auto h-full cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                                >
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </IndividualPinContextMenu>
        </div>
    );
}
