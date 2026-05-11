'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { type Node, useReactFlow } from '@xyflow/react';
import { UploadIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useRef } from 'react';
import { toast } from 'sonner';
import InputError from './input-error';

interface ImageTaskForm extends Record<string, File | string | undefined> {
    image?: File;
    image_link?: string;
}

export function AddImageDialog({ children, taskId }: { children: ReactNode; taskId: string }) {
    const project_id = usePage().url.split('/')[1];

    const formRef = useRef<HTMLFormElement>(null);
    const { data, setData, errors } = useForm<ImageTaskForm>({});
    const { updateNode } = useReactFlow<Node<{ image?: string | null }>>();

    function addImage(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        router.post(
            route('tasks.update', { project: project_id, task: taskId }),
            {
                ...data,
                _method: 'PATCH',
            },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: (page) => {
                    const flash = (page.props as unknown as SharedData).flash;

                    updateNode(taskId, (node) => ({
                        data: { ...node.data, image: flash?.updatedTask?.image },
                    }));
                },
                onError: () => {
                    toast.error('An error occurred when adding an image to a task.');
                },
            },
        );
    }

    return (
        <Dialog>
            <DialogTrigger>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add an image to the task</DialogTitle>
                    <DialogDescription>Upload a file or paste an image link</DialogDescription>
                </DialogHeader>

                <form ref={formRef} onSubmit={addImage} className="grid gap-4">
                    <div className="relative m-auto flex aspect-square w-40 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border/80 shadow-sm">
                        <UploadIcon className="text-muted-foreground" />
                        <input
                            type="file"
                            accept="image/*"
                            id="image"
                            name="image"
                            onChange={(e) => {
                                const file = e.target.files?.[0];

                                if (file) {
                                    setData('image', file);
                                }
                            }}
                            className="absolute h-full w-full cursor-pointer opacity-0"
                        />
                    </div>
                    {data.image && <span className="mx-auto mb-4 w-fit text-sm text-muted-foreground">{data.image.name}</span>}

                    <InputError message={errors.image} />

                    <span className="mx-auto text-muted-foreground">or</span>

                    <div>
                        <Label htmlFor="link">Link</Label>
                        <Input
                            id="link"
                            placeholder="Paste an image's link"
                            onChange={(e) => setData('image_link', e.target.value)}
                            className="mt-1"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Save Image</Button>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
