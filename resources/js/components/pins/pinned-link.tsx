import { getPinnedWebsiteLogoDataUri } from '@/lib/pin-logo-catalog';
import { getWebsiteNameFromUrl } from '@/lib/pins';
import type { Pinned } from '@/types/models';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Globe, GripVertical } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { IndividualPinContextMenu } from './individual-pin-context-menu';

export default function PinnedLink({
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

    const websiteName = pin.title || (pin.url ? getWebsiteNameFromUrl(pin.url) : 'Link');
    const logoSrc = getPinnedWebsiteLogoDataUri(websiteName);

    return (
        <div data-testid={`pin-link-${pin.id}`} ref={setNodeRef} style={style} className={`${isDragging ? 'z-50' : ''}`}>
            <IndividualPinContextMenu pins={pins} id={pin.id} setPins={setPins}>
                <Card className="group hover cursor-pointer border-2 border-dashed border-border/50 py-3 transition-colors hover:bg-accent/50">
                    <CardContent className="px-4">
                        <div className="relative flex items-center gap-3">
                            {/* Drag Handle */}
                            {allowToDrag && (
                                <div
                                    {...attributes}
                                    {...listeners}
                                    className="absolute top-1/2 -right-2 z-10 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                                >
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}

                            <a href={pin.url} target="_blank" rel="noreferrer">
                                <div className="relative flex-shrink-0">
                                    {logoSrc ? (
                                        <img
                                            src={logoSrc || '/placeholder.svg'}
                                            alt={`${websiteName} logo`}
                                            className="h-10 w-10 rounded-sm bg-white p-1"
                                        />
                                    ) : (
                                        <Globe className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                            </a>
                            <div className="min-w-0 flex-1 pr-6">
                                <a href={pin.url} target="_blank" rel="noreferrer">
                                    <div className="mb-1 flex items-center gap-2">
                                        <h3 className="font-medium text-foreground">{websiteName}</h3>
                                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                </a>
                                <p className="truncate text-sm text-muted-foreground">{pin.url}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </IndividualPinContextMenu>
        </div>
    );
}
