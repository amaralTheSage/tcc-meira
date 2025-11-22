import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { DialogClose } from '@radix-ui/react-dialog';
import { UUID } from 'crypto';
import { Button } from '../ui/button';

export default function ConfirmDeletionDialog({ id }: { id: UUID }) {
    const form = useForm();

    return (
        <Dialog>
            <DialogTrigger className="rounded-md bg-red-700 px-6 py-2 text-sm font-extrabold text-primary-foreground uppercase">Delete</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>This action cannot be undone.</DialogDescription>
                </DialogHeader>

                <div className="ml-auto flex gap-4">
                    <DialogClose>
                        <Button>Cancel</Button>
                    </DialogClose>

                    <Button
                        variant={'secondary'}
                        onClick={(e) => {
                            e.preventDefault();
                            form.delete(route('project.destroy', id));
                        }}
                    >
                        I am Sure
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
