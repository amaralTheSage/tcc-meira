import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';

export default function ConfirmationDialog() {
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
                <DialogFooter>
                    <DialogClose>
                        <Button type="submit" form="publish-form">
                            Confirm
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
