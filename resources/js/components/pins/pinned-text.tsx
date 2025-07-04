import { PinnedTextType } from '@/types/models';

import { Card, CardContent } from '@/components/ui/card';
import { Pin } from 'lucide-react';

export default function PinnedText({ pin }: { pin: PinnedTextType }) {
    return (
        <Card className={`col-span-2 border-dashed py-3 transition-colors hover:bg-accent/50`}>
            <CardContent className="px-4">
                <div className="flex gap-3">
                    <Pin className="h-4.5 w-4.5 -rotate-12 text-muted-foreground" />

                    <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 text-sm leading-relaxed text-foreground">{pin.text}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
