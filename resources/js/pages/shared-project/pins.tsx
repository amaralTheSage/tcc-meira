import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPinnedWebsiteLogoDataUri } from '@/lib/pin-logo-catalog';
import { getPinType, getWebsiteNameFromUrl, openAllLinks } from '@/lib/pins';
import { Pinned, Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import { ExternalLink, Globe, Pin } from 'lucide-react';
import SharedProjectLayout from './layout';

export default function SharedPins({ project, pins }: { project: Project; pins: Pinned[] }) {
    return (
        <SharedProjectLayout active="pins" project={project}>
            <Head title={`${project.title} Pins`} />
            <main className="mx-auto w-full max-w-5xl p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl">
                        <Pin className="h-6 w-6" />
                        Pins
                    </h2>
                    <Button variant="outline" onClick={() => openAllLinks(pins)}>
                        Open All Links
                    </Button>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {pins.map((pin) => (
                        <ReadOnlyPin key={pin.id} pin={pin} />
                    ))}
                </div>
            </main>
        </SharedProjectLayout>
    );
}

function ReadOnlyPin({ pin }: { pin: Pinned }) {
    return getPinType(pin) === 'link' ? <ReadOnlyLink pin={pin} /> : <ReadOnlyText pin={pin} />;
}

function ReadOnlyLink({ pin }: { pin: Pinned }) {
    const websiteName = pin.title || (pin.url ? getWebsiteNameFromUrl(pin.url) : 'Link');
    const logoSrc = getPinnedWebsiteLogoDataUri(websiteName);

    return (
        <Card className="rounded-md border-dashed py-3">
            <CardContent className="flex items-center gap-3 px-4">
                {logoSrc ? <img src={logoSrc} alt={`${websiteName} logo`} className="h-10 w-10 rounded-sm bg-white p-1" /> : <Globe className="h-6 w-6" />}
                <div className="min-w-0 flex-1">
                    <a href={pin.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-medium">
                        {websiteName}
                        <ExternalLink className="h-3 w-3" />
                    </a>
                    <p className="truncate text-sm text-muted-foreground">{pin.url}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function ReadOnlyText({ pin }: { pin: Pinned }) {
    return (
        <Card className="rounded-md border-dashed py-3 md:col-span-2">
            <CardContent className="flex gap-3 px-4">
                <Pin className="h-4.5 w-4.5 -rotate-12 text-muted-foreground" />
                <p className="text-sm leading-relaxed">{pin.text}</p>
            </CardContent>
        </Card>
    );
}
