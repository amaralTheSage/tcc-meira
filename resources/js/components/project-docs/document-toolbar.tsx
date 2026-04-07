import { Button } from '@/components/ui/button';
import type { Editor } from '@tiptap/react';
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    ImageIcon,
    Italic,
    Link,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Save,
    SeparatorHorizontal,
    Strikethrough,
    Undo2,
} from 'lucide-react';
import { useRef, type ChangeEvent, type ComponentType } from 'react';

interface DocumentToolbarProps {
    editor: Editor | null;
    onSave: () => void;
    onUploadImage: (file: File) => Promise<string | null>;
    saveDisabled: boolean;
    status: string;
}

export function DocumentToolbar({ editor, onSave, onUploadImage, saveDisabled, status }: DocumentToolbarProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);

    async function handleImageChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const file = event.currentTarget.files?.[0];
        if (!file || !editor) return;

        const url = await onUploadImage(file);
        if (url) editor.chain().focus().setImage({ src: url }).run();
        event.currentTarget.value = '';
    }

    return (
        <div className="flex min-h-12 flex-wrap items-center gap-1 border-b border-border bg-background px-3 py-2">
            <ToolbarButton label="Undo" disabled={!editor} onClick={() => editor?.chain().focus().undo().run()} icon={Undo2} />
            <ToolbarButton label="Redo" disabled={!editor} onClick={() => editor?.chain().focus().redo().run()} icon={Redo2} />
            <ToolbarDivider />
            <ToolbarButton label="Heading 1" active={editor?.isActive('heading', { level: 1 })} onClick={() => setHeading(editor, 1)} icon={Heading1} />
            <ToolbarButton label="Heading 2" active={editor?.isActive('heading', { level: 2 })} onClick={() => setHeading(editor, 2)} icon={Heading2} />
            <ToolbarButton label="Bold" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} icon={Bold} />
            <ToolbarButton label="Italic" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} icon={Italic} />
            <ToolbarButton label="Strike" active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} icon={Strikethrough} />
            <ToolbarButton label="Inline code" active={editor?.isActive('code')} onClick={() => editor?.chain().focus().toggleCode().run()} icon={Code} />
            <ToolbarDivider />
            <ToolbarButton label="Link" active={editor?.isActive('link')} onClick={() => setLink(editor)} icon={Link} />
            <ToolbarButton label="Quote" active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} icon={Quote} />
            <ToolbarButton label="Bullet list" active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} icon={List} />
            <ToolbarButton label="Ordered list" active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} icon={ListOrdered} />
            <ToolbarButton label="Code block" active={editor?.isActive('codeBlock')} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} icon={Code} />
            <ToolbarButton label="Rule" onClick={() => editor?.chain().focus().setHorizontalRule().run()} icon={SeparatorHorizontal} />
            <ToolbarButton label="Image" onClick={() => imageInputRef.current?.click()} icon={ImageIcon} />
            <input ref={imageInputRef} className="hidden" type="file" accept="image/*" onChange={handleImageChange} />
            <div className="ml-auto flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{status}</span>
                <Button size="sm" variant="secondary" onClick={onSave} disabled={saveDisabled}>
                    <Save className="h-4 w-4" />
                    Save
                </Button>
            </div>
        </div>
    );
}

interface ToolbarButtonProps {
    active?: boolean;
    disabled?: boolean;
    icon: ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}

function ToolbarButton({ active = false, disabled = false, icon: Icon, label, onClick }: ToolbarButtonProps) {
    return (
        <Button
            aria-label={label}
            className={active ? 'bg-accent text-accent-foreground' : ''}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            size="icon"
            title={label}
            type="button"
            variant="ghost"
        >
            <Icon className="h-4 w-4" />
        </Button>
    );
}

function ToolbarDivider() {
    return <div className="mx-1 h-6 w-px bg-border" />;
}

function setHeading(editor: Editor | null, level: 1 | 2): void {
    editor?.chain().focus().toggleHeading({ level }).run();
}

function setLink(editor: Editor | null): void {
    if (!editor) return;

    const currentHref = editor.getAttributes('link').href as string | undefined;
    const href = window.prompt('URL', currentHref ?? 'https://');
    if (href === null) return;
    if (href.trim() === '') {
        editor.chain().focus().unsetLink().run();
        return;
    }

    editor.chain().focus().setLink({ href: href.trim() }).run();
}
