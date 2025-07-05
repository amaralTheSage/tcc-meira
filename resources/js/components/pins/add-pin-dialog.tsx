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
import { ReactNode } from 'react';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

export default function AddPinsDialog({
    children,
    type,
    pins,
    setPins,
}: {
    children: ReactNode;
    type: 'link' | 'text';
    pins: Pinned;
    setPins: React.Dispatch<React.SetStateAction<Pinned[]>>;
}) {
    const { post, setData, data } = useForm({ type: type, position: pins.length + 1 });
    const project_id = usePage().url.split('/')[1];

    function submit(e: React.FormEvent) {
        e.preventDefault();
        console.log('DATA SUBMITTED:', data);
        console.log(pins);

        post(route('pins.store', { project: project_id }), {
            preserveScroll: true,
            onSuccess: () => {
                setPins([...pins, data]);
            },
            onError: (errors) => {
                toast.error('An error occurred when creating the pin.');
                console.error(errors);
            },
        });
    }

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit} className="space-y-4">
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
                        <Button type="submit">Add</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
