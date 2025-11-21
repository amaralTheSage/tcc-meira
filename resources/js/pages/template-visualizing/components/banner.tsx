'use client';

import { Eye, XIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function Banner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="dark bg-muted px-4 py-2 text-foreground">
            <div className="flex gap-2 md:items-center">
                <div className="flex grow gap-3 md:items-center">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 max-md:mt-0.5" aria-hidden="true">
                        <Eye className="opacity-80" size={16} />
                    </div>
                    <div className="flex grow flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div className="space-y-0.5">
                            <p className="text-sm font-medium">
                                You're currently visualizing a project <span className="underline">Template</span>
                            </p>
                            <p className="text-sm text-muted-foreground">You can use this template to help your own project take off!</p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="group -my-1.5 -me-2 size-8 shrink-0 p-0 hover:bg-transparent"
                    onClick={() => setIsVisible(false)}
                    aria-label="Close banner"
                >
                    <XIcon size={16} className="opacity-60 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}
