import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadIcon } from 'lucide-react';

interface TaskImageDialogProps {
    image?: File;
    onClose: () => void;
    onImageChange: (file: File | undefined) => void;
    onImageLinkChange: (link: string) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * Renders the task image form in its own modal surface.
 *
 * @example
 * <TaskImageDialog image={data.image} onSubmit={addImage} onClose={closeDialog} />
 */
export default function TaskImageDialog({ image, onClose, onImageChange, onImageLinkChange, onSubmit }: TaskImageDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-96 max-w-md rounded-md border border-border/70 bg-background p-4 shadow-xl shadow-black/40"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 className="mb-4 text-lg font-bold text-white">Add Image</h3>
                <form onSubmit={onSubmit}>
                    <TaskImageFileField image={image} onImageChange={onImageChange} />
                    <TaskImageLinkField onImageLinkChange={onImageLinkChange} />
                    <TaskImageDialogActions onClose={onClose} />
                </form>
            </div>
        </div>
    );
}

function TaskImageFileField({ image, onImageChange }: Pick<TaskImageDialogProps, 'image' | 'onImageChange'>) {
    return (
        <>
            <div className="relative mb-2 flex aspect-square w-20 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border/80 shadow-sm">
                <UploadIcon className="h-6 w-6 text-gray-400" />
                <input
                    type="file"
                    accept="image/*"
                    id="image"
                    name="image"
                    onChange={(event) => onImageChange(event.currentTarget.files?.[0])}
                    className="absolute h-full w-full cursor-pointer opacity-0"
                />
            </div>
            {image && <span className="mb-2 w-fit text-sm text-muted-foreground">{image.name}</span>}
        </>
    );
}

function TaskImageLinkField({ onImageLinkChange }: Pick<TaskImageDialogProps, 'onImageLinkChange'>) {
    return (
        <>
            <span className="mx-auto text-sm text-muted-foreground">or</span>
            <div className="mt-2">
                <Label htmlFor="link" className="text-sm text-gray-300">
                    Link
                </Label>
                <Input id="link" placeholder="Paste an image's link" onChange={(event) => onImageLinkChange(event.target.value)} className="mt-1" />
            </div>
        </>
    );
}

function TaskImageDialogActions({ onClose }: Pick<TaskImageDialogProps, 'onClose'>) {
    return (
        <div className="mt-4 flex justify-end gap-2">
            <Button type="button" onClick={onClose} variant="outline" className="px-3 py-1">
                Cancel
            </Button>
            <Button type="submit" className="rounded-md bg-red-800 px-3 py-1 text-white hover:bg-red-700">
                Save Image
            </Button>
        </div>
    );
}
