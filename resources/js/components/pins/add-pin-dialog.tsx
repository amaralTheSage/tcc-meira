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
import { Pinned } from '@/types/models';
import { useForm, usePage } from '@inertiajs/react';
import { ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface PinForm extends Record<string, string | number | undefined> {
    type: 'link' | 'text';
    title?: string;
    url?: string;
    text?: string;
    position: number;
}

export default function AddPinsDialog({ children, type, pins }: { children: ReactNode; type: 'link' | 'text'; pins: Pinned[] }) {
    const { post, setData } = useForm<PinForm>({ type: type, position: pins.length + 1 });
    const project_id = usePage().url.split('/')[1];

    function submit(e: React.FormEvent): void {
        e.preventDefault();

        post(route('pins.store', { project: project_id }), {
            preserveScroll: true,
            preserveState: 'errors',
            onError: () => {
                toast.error('An error occurred when creating the pin.');
            },
        });
    }

    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form data-testid={`pin-${type}-form`} onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>New Pin</DialogTitle>
                        <DialogDescription>
                            {type === 'link' ? 'Pin links important to your project' : 'Pin important info - reminders, notices, warnings'}
                        </DialogDescription>
                    </DialogHeader>

                    <div>
                        {type === 'link' ? (
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="title">
                                        Title <span className="text-xs text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Input
                                        data-testid="pin-title-input"
                                        id="title"
                                        name="title"
                                        placeholder="GitHub"
                                        onChange={(e) => {
                                            setData('title', e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="URL">URL</Label>
                                    <Input
                                        data-testid="pin-url-input"
                                        id="URL"
                                        name="URL"
                                        placeholder="www.example.com"
                                        required
                                        onChange={(e) => {
                                            setData('url', e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                <div className="grid gap-3">
                                    <Textarea
                                        data-testid="pin-text-input"
                                        id="text"
                                        name="text"
                                        className="h-72"
                                        onChange={(e) => {
                                            setData('text', e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button data-testid="pin-submit" type="submit">
                            Add
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
