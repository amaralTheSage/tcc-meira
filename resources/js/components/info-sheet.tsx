import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Info } from 'lucide-react';
import { ReactNode } from 'react';
import { ScrollArea } from './ui/scroll-area';

export default function InfoSheet({ children }: { children: ReactNode }) {
    return (
        <Sheet>
            <SheetTrigger>
                <Info className="mx-auto w-5 text-muted-foreground" strokeWidth={3} />
            </SheetTrigger>
            <SheetContent className="w-[350px] py-6 pl-6 text-sm [&>button]:hidden">
                <ScrollArea className="h-full pr-6">
                    <div className="space-y-4">{children}</div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
