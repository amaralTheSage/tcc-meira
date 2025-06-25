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
import { router, useForm, usePage } from '@inertiajs/react';
import { useReactFlow } from '@xyflow/react';
import { UploadIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import InputError from './input-error';

export function AddImageDialog({ children, taskId }) {
    const project_id = usePage().url.split('/')[1];

    const formRef = useRef<HTMLFormElement>(null);
    const { data, setData, errors } = useForm();
    const { updateNode } = useReactFlow();

    useEffect(() => {
        console.log(data);
    }, [data]);

    function addImage(e) {
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
                    console.log('PAGE: ', page.props.flash);
                    updateNode(taskId, (node) => ({
                        data: { ...node.data, image: page.props.flash.updatedTask.image },
                    }));
                },
                onError: (errors) => {
                    toast.error('An error occurred when adding an image to a task.');
                    console.error(errors);
                },
            },
        );
    }

    return (
        <Dialog>
            <DialogTrigger>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add an image to the task</DialogTitle>
                    <DialogDescription>Upload a file or paste an image link</DialogDescription>
                </DialogHeader>

                <form ref={formRef} onSubmit={addImage} className="grid gap-4">
                    <div className="relative m-auto flex aspect-square w-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 shadow-sm">
                        <UploadIcon className="text-gray-400" />
                        <input
                            type="file"
                            accept="image/*"
                            id="image"
                            name="image"
                            onChange={(e) => {
                                setData('image', e.target.files[0]);
                            }}
                            className="absolute h-full w-full cursor-pointer opacity-0"
                        />
                    </div>
                    {data.image && <span className="mx-auto mb-4 w-fit text-sm text-gray-600">{data.image.name}</span>}

                    <InputError message={errors.image} />

                    <div>
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input id="link" placeholder="Paste an image's link" onChange={(e) => setData('image_link', e.target.value)} />
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
