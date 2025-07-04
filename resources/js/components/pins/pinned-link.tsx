import { getWebsiteLogo, getWebsiteNameFromUrl } from '@/lib/pins';
import { PinnedLinkType } from '@/types/models';
import { ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

export default function PinnedLink({ pin }: { pin: PinnedLinkType }) {
    const websiteName = pin.title || getWebsiteNameFromUrl(pin.url);
    const logoSrc = getWebsiteLogo(websiteName.toLowerCase());

    return (
        <Card className="group hover cursor-pointer border-dashed border-border/50 py-3 transition-colors hover:bg-accent/50">
            <CardContent className="px-4">
                <div className="relative flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                        {logoSrc ? (
                            <img src={logoSrc || '/placeholder.svg'} alt={`${websiteName} logo`} className="h-10 w-10 rounded-sm bg-accent p-1" />
                        ) : (
                            <Globe className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{websiteName}</h3>
                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{pin.url}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
