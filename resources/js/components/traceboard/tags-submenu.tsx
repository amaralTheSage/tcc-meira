import { ContextMenuItem, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from '@/components/ui/context-menu';
import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ColorPicker, ColorPickerAlpha, ColorPickerEyeDropper, ColorPickerHue, ColorPickerOutput, ColorPickerSelection } from './color-picker';

export type TaskTag = {
    id: string;
    name: string;
    color: string;
};

function TagEditDialog({ tag, onSave, onClose }: { tag: TaskTag; onSave: (id: string, name: string, color: string) => void; onClose: () => void }) {
    const [name, setName] = useState(tag.name);
    const [color, setColor] = useState(tag.color);

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
                        <button
                            onClick={() => {
                                onSave(tag.id, name, color);
                                onClose();
                            }}
                            className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Save
                        </button>
                        <button onClick={onClose} className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TagsSubmenu() {
    const [tags, setTags] = useState<TaskTag[]>([
        { id: '1', name: 'Bug', color: '#ef4444' },
        { id: '2', name: 'Feature', color: '#3b82f6' },
        { id: '3', name: 'Enhancement', color: '#22c55e' },
    ]);
    const [editingTag, setEditingTag] = useState<TaskTag | null>(null);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTagName, setNewTagName] = useState('');

    function addTag() {
        if (!newTagName.trim()) return;

        const newTag: TaskTag = {
            id: Date.now().toString(),
            name: newTagName,
            color: '#3b82f6', // default blue
        };

        setTags([...tags, newTag]);
        setNewTagName('');
        setIsAddingTag(false);
    }

    function updateTag(id: string, name: string, color: string) {
        setTags(tags.map((tag) => (tag.id === id ? { ...tag, name, color } : tag)));
    }

    function deleteTag(id: string) {
        setTags(tags.filter((tag) => tag.id !== id));
    }

    return (
        <>
            <ContextMenuSub>
                <ContextMenuSubTrigger inset>Tags</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-56">
                    {tags.length > 0 ? (
                        <>
                            {tags.map((tag) => (
                                <ContextMenuItem
                                    key={tag.id}
                                    className="group flex items-center justify-between"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <button onDoubleClick={() => setEditingTag(tag)} className="flex flex-1 items-center gap-2">
                                        <span className="rounded-xl px-4 text-sm text-primary-foreground" style={{ backgroundColor: tag.color }}>
                                            {tag.name}
                                        </span>
                                    </button>
                                    <button onClick={() => deleteTag(tag.id)} className="opacity-0 transition-opacity group-hover:opacity-100">
                                        <Trash2 className="size-3.5 text-destructive" />
                                    </button>
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
                                    if (e.key === 'Enter') addTag();
                                    if (e.key === 'Escape') {
                                        setIsAddingTag(false);
                                        setNewTagName('');
                                    }
                                }}
                                onBlur={() => {
                                    if (newTagName.trim()) {
                                        addTag();
                                    } else {
                                        setIsAddingTag(false);
                                    }
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

            {editingTag && <TagEditDialog tag={editingTag} onSave={updateTag} onClose={() => setEditingTag(null)} />}
        </>
    );
}
