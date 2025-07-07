import AddPinsMenu from '@/components/pins/add-pins-menu';
import PinnedLink from '@/components/pins/pinned-link';
import PinnedText from '@/components/pins/pinned-text';
import { PinsContextMenu } from '@/components/pins/pins-context-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { getPinType, openAllLinks } from '@/lib/pins';
import type { BreadcrumbItem } from '@/types';
import type { Pinned, Project } from '@/types/models';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Pin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pins',
        href: '/pins',
    },
];

interface MoveType {
    id: number;
    position: number;
}

export default function Pins({ project, pins }: { project: Project; pins: Pinned[] }) {
    const [pins2, setPins] = useState(pins);
    const [pendingMoves, setPendingMoves] = useState<MoveType[]>([]);
    const movesRef = useRef<MoveType[]>(pendingMoves);

    const syncMoves = useRef(
        debounce(() => {
            if (movesRef.current.length === 0) return;

            movesRef.current.forEach((move) => {
                router.patch(route('pins.move', { project: project.id, pin: move.id }), { position: move.position }, {});
            });

            setPendingMoves([]);
        }, 3000),
    ).current;

    function queueMoves(id: number, position: number) {
        setPendingMoves((moves) => [...moves, { id, position }]);
        syncMoves();
    }

    useEffect(() => {
        movesRef.current = pendingMoves;
    }, [pendingMoves]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        setPins((pins) => {
            const oldIndex = pins.findIndex((pin) => pin.id === active.id);
            const newIndex = pins.findIndex((pin) => pin.id === over.id);

            if (oldIndex === -1 || newIndex === -1) {
                return pins;
            }

            const reorderedPins = arrayMove(pins, oldIndex, newIndex);

            reorderedPins.forEach((pin, index) => {
                const newPosition = index + 1;
                if (pin.position !== newPosition) {
                    queueMoves(pin.id, newPosition);
                }
            });

            return reorderedPins;
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Pins" />
            <div className="mx-auto w-full p-2 md:max-w-5xl">
                <div className="my-3 flex items-end justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl">
                            <Pin className="h-6 w-6" />
                            Pins
                        </h1>
                        <p className="hidden text-muted-foreground sm:block">Keep track of important links and notes</p>
                    </div>
                    <Button
                        variant={'outline'}
                        onClick={() => {
                            openAllLinks(pins2);
                        }}
                    >
                        Open All Links
                    </Button>
                </div>

                <PinsContextMenu pins={pins2} setPins={setPins}>
                    <ScrollArea className="mx-auto h-[69vh] overflow-x-hidden rounded-xl border p-2 pr-4" type="always">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToParentElement]}
                        >
                            <SortableContext items={pins.map((pin) => pin.id)} strategy={verticalListSortingStrategy}>
                                <div className="grid min-w-0 touch-none grid-cols-2 gap-2 overflow-x-hidden">
                                    {pins2.map((pin) => {
                                        return getPinType(pin) === 'link' ? (
                                            <PinnedLink key={pin.id || pin.title || pin.position} pin={pin} pins={pins2} setPins={setPins} />
                                        ) : (
                                            <PinnedText key={pin.id || pin.title || pin.position} pin={pin} pins={pins2} setPins={setPins} />
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </ScrollArea>
                    <AddPinsMenu pins={pins2} setPins={setPins} />
                </PinsContextMenu>
            </div>
        </AppLayout>
    );
}
