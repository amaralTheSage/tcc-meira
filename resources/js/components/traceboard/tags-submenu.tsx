import { ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { Tag } from '@/types/models';
import { router } from '@inertiajs/react';
import { Check, Edit, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from './color-picker';

function TagEditDialog({
    tag,
    projectId,
    onClose,
    onLocalUpdate,
}: {
    tag: Tag;
    projectId: string;
    onClose: () => void;
    onLocalUpdate: (tag: Tag) => void;
}) {
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);

    function tagPatchRequest() {
        router.patch(
            `/${projectId}/tags/${tag.id}`,
            { name, color },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onLocalUpdate({ ...tag, name, color });
                    onClose();
                },
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="w-80 rounded-lg border bg-popover p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Edit Tag</h3>
                    <button onClick={onClose} className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-hidden focus:ring-2 focus:ring-ring"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium">Color</label>
                        <ColorPicker value={color} onChange={setColor}>
                            <ColorPickerSelection />
                            <div className="flex items-center gap-2">
                                <ColorPickerHue className="flex-1" />
                                <ColorPickerEyeDropper />
                            </div>
                            <ColorPickerAlpha />
                            <ColorPickerOutput />
                        </ColorPicker>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button onClick={tagPatchRequest} className="cursor-pointer px-4">
                            Save
                        </Button>

                        <button onClick={onClose} className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TagsSubmenu({
    projectId,
    initialTags,
    task_id,
    onSetTags,
    tagsInUse,
}: {
    projectId: string;
    initialTags?: Tag[];
    task_id: string;
    tagsInUse: Tag[];
    onSetTags: React.Dispatch<React.SetStateAction<Tag[]>>;
}) {
    const [tags, setTags] = useState<Tag[]>(initialTags || []);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    function tagPostRequest() {
        router.post(
            `/${projectId}/tags`,
            { name: newTagName, color: '#3b82f6' },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const created = page.props.flash.tag;
                    console.log(created);

                    setTags([...tags, created]);
                    setNewTagName('');
                    setIsAddingTag(false);
                },
            },
        );
    }

    function applyTagRequest(tag: Tag) {
        router.post(
            `/${projectId}/apply-tag`,
            { tag_id: tag.id, task_id: task_id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onSetTags((prevTags) => [...prevTags!, tag]);
                },
            },
        );
    }

    function removeTagRequest(tag: Tag) {
        router.post(
            `/${projectId}/remove-tag`,
            { tag_id: tag.id, task_id: task_id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onSetTags((prevTags) => [...prevTags!, tag]);
                },
            },
        );
    }

    function tagDeleteRequest(tag: Tag) {
        router.delete(`/${projectId}/tags/${tag.id}`, {
            preserveScroll: true,
            onSuccess: () => setTags(tags.filter((t) => t.id !== tag.id)),
        });
    }

    return (
        <>
            <ContextMenuSub>
                <ContextMenuSubTrigger inset>Tags</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-56">
                    {tags.length > 0 ? (
                        <>
                            {tags?.map((tag) => (
                                <ContextMenuItem
                                    key={tag.id}
                                    className="group flex items-center justify-between"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    {tagsInUse.includes(tag.id) && <Check />}

                                    <div className="flex flex-1 items-center gap-2">
                                        <button
                                            style={{ backgroundColor: tag.color }}
                                            className="cursor-pointer rounded-xl px-4 text-sm text-primary-foreground"
                                            onClick={() => applyTagRequest(tag)}
                                        >
                                            {tag.name}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button onClick={() => setEditingTag(tag)} className="cursor-pointer text-muted-foreground">
                                            <Edit className="size-3.5" />
                                        </button>
                                        <button
                                            onClick={() => tagDeleteRequest(tag)}
                                            className="cursor-pointer text-destructive hover:text-destructive/80"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </ContextMenuItem>
                            ))}

                            <ContextMenuSeparator />
                        </>
                    ) : (
                        <>
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">No tags yet</div>
                            <ContextMenuSeparator />
                        </>
                    )}

                    {isAddingTag ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                            <input
                                type="text"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        tagPostRequest();
                                    }

                                    if (e.key === 'Escape') {
                                        setIsAddingTag(false);
                                        setNewTagName('');
                                    }
                                }}
                                onBlur={() => {
                                    if (!newTagName.trim()) {
                                        setIsAddingTag(false);
                                        return;
                                    }

                                    tagPostRequest();
                                }}
                                placeholder="Tag name..."
                                className="w-full rounded border bg-background px-2 py-1 text-xs outline-hidden focus:ring-1 focus:ring-ring"
                                autoFocus
                            />
                        </div>
                    ) : (
                        <ContextMenuItem
                            onSelect={(e) => {
                                e.preventDefault();
                                setIsAddingTag(true);
                            }}
                        >
                            <Plus className="mr-2 size-4" />
                            Add Tag
                        </ContextMenuItem>
                    )}
                </ContextMenuSubContent>
            </ContextMenuSub>

            {editingTag && (
                <TagEditDialog
                    tag={editingTag}
                    projectId={projectId}
                    onLocalUpdate={(t) => setTags(tags.map((x) => (x.id === t.id ? t : x)))}
                    onClose={() => setEditingTag(null)}
                />
            )}
        </>
    );
}
