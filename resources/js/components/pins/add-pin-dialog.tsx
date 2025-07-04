import { Button } from '@/components/ui/button';
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
import { ReactNode } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export default function AddPinsDialog({ children, type }: { children: ReactNode; type: 'link' | 'text' }) {
    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>{children}</DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>New Pin</DialogTitle>
                        <DialogDescription>
                            {type === 'link' ? 'Pin links important to your project' : 'Pin important info - reminders, notices, warnings'}
                        </DialogDescription>
                    </DialogHeader>

                    {type === 'link' ? (
                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Label htmlFor="title">
                                    Title <span className="text-xs text-muted-foreground">(optional)</span>
                                </Label>
                                <Input id="title" name="title" placeholder="GitHub" />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="URL">URL</Label>
                                <Input id="URL" name="URL" placeholder="www.example.com" />
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <div className="grid gap-3">
                                <Textarea id="text" name="text" className="h-72" />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}
