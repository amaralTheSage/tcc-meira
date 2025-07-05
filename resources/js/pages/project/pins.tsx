import AddPinsMenu from '@/components/pins/add-pins-menu';
import PinnedLink from '@/components/pins/pinned-link';
import PinnedText from '@/components/pins/pinned-text';
import { PinsContextMenu } from '@/components/pins/pins-context-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import { getPinType } from '@/lib/pins';
import type { BreadcrumbItem } from '@/types';
import type { Pinned, Project } from '@/types/models';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head } from '@inertiajs/react';
import { Pin } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pins',
        href: '/pins',
    },
];

export default function Pins({ project, pins }: { project: Project; pins: Pinned[] }) {
    const [pins2, setPins] = useState(pins);

    useEffect(() => {
        pins2.forEach((pin, index) => {
            if (pin.position !== index + 1) {
                // send update request here
                console.log(`Pin ${pin.title} at index ${index} has wrong position ${pin.position}`);
            }
        });
    }, [pins2]);

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

            return arrayMove(pins, oldIndex, newIndex);
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Pins" />
            <div className="mx-auto p-4 md:max-w-5xl">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl">
                            <Pin className="h-6 w-6" />
                            Pins
                        </h1>
                        <p className="hidden text-muted-foreground sm:block">Keep track of important links and notes</p>
                    </div>
                    <Button variant={'outline'}>Open All Links</Button>
                </div>

                <PinsContextMenu pins_length={pins2.length}>
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
                                            <PinnedLink key={pin.id} pin={pin} pins_length={pins2.length} />
                                        ) : (
                                            <PinnedText key={pin.id} pin={pin} pins_length={pins2.length} />
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </ScrollArea>
                    <AddPinsMenu pins_length={pins2.length} />
                </PinsContextMenu>
            </div>
        </AppLayout>
    );
}
