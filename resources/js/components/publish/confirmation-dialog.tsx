import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReactNode } from 'react';

export default function ConfirmationDialog({ children }: { children: ReactNode }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button className="col-start-2 mt-8 ml-auto rounded-md bg-primary px-7 py-2 text-lg font-medium text-background">Publish</button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>You will not be able to use this project anymore. This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>{children}</DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
