import PinnedLink from '@/components/pins/pinned-link';
import PinnedText from '@/components/pins/pinned-text';
import { PinsContextMenu } from '@/components/pins/pins-context-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getPinType, openAllLinks } from '@/lib/pins';
import type { BreadcrumbItem } from '@/types';
import { Project, Template } from '@/types/models';
import { Head } from '@inertiajs/react';
import { Pin } from 'lucide-react';
import { useState } from 'react';
import AppLayout from './visualizing-layout/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pins',
        href: '/pins',
    },
];

export default function Pins({ template }: { template: Template }) {
    const [pins2, setPins] = useState(template.data.pins);
    const previewProject: Project = {
        id: template.id,
        title: template.name,
        members: [],
        edge_type: 'bezier',
        animated_edges: true,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={previewProject}>
            <Head title="Pins" />
            <div className="mx-auto max-h-[78.5vh] w-full px-4 md:max-w-5xl">
                <div className="my-3 flex items-end justify-between p-2">
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

                <PinsContextMenu pins={template.data.pins} setPins={setPins}>
                    <ScrollArea className="mx-auto h-full overflow-x-hidden p-2 pr-4" type="always">
                        <div className="grid min-w-0 touch-none grid-cols-2 gap-2 overflow-x-hidden">
                            {pins2.map((pin) => {
                                return getPinType(pin) === 'link' ? (
                                    <PinnedLink
                                        key={pin.id || pin.title || pin.position}
                                        pin={pin}
                                        pins={pins2}
                                        allowToDrag={false}
                                        setPins={setPins}
                                    />
                                ) : (
                                    <PinnedText
                                        key={pin.id || pin.title || pin.position}
                                        pin={pin}
                                        pins={pins2}
                                        allowToDrag={false}
                                        setPins={setPins}
                                    />
                                );
                            })}
                        </div>
                    </ScrollArea>
                </PinsContextMenu>
            </div>
        </AppLayout>
    );
}
