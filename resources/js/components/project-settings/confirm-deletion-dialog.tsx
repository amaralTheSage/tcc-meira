import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from '@inertiajs/react';
import { Button } from '../ui/button';

export default function ConfirmDeletionDialog({ id }: { id: string }) {
    const form = useForm();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="destructive" className="px-6 font-extrabold uppercase">
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>This action cannot be undone.</DialogDescription>
                </DialogHeader>

                <div className="ml-auto flex gap-4">
                    <DialogClose asChild>
                        <Button type="button">Cancel</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
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
