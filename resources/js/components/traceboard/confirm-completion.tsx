import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ReactElement, cloneElement, useState } from 'react';

export function ConfirmCompletion({ children, completeTask }: { children: React.ReactNode; completeTask: () => void }) {
    const [open, setOpen] = useState(false);

    const handleCompleteTask = () => {
        completeTask();
        setOpen(false);
    };

    // Clona o elemento filho p abrir o diálogo pq da forma padrão estava bugando por algum motivo
    const modifiedChild = cloneElement(children as ReactElement, {
        onSelect: (e: Event) => {
            e.preventDefault();
            setOpen(true);
        },
    });

    return (
        <>
            {modifiedChild}

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will mark every subtask as completed.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteTask}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
