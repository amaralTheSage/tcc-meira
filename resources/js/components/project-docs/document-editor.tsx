import { editorJsonToMarkdown, markdownToHtml } from '@/lib/docs-markdown';
import { cn } from '@/lib/utils';
import type { ProjectDocument } from '@/types/models';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef } from 'react';
import { DocumentToolbar } from './document-toolbar';
import { RemoteCursors, remoteCursorKey, type RemoteCursorSelection } from './remote-cursors';

interface DocumentEditorProps {
    document: ProjectDocument;
    markdown: string;
    onMarkdownChange: (markdown: string) => void;
    onSave: () => void;
    onSelectionChange: (selection: { from: number; to: number }) => void;
    onUploadImage: (file: File) => Promise<string | null>;
    remoteSelections: RemoteCursorSelection[];
    saveDisabled: boolean;
    status: string;
}

export function DocumentEditor(props: DocumentEditorProps) {
    const appliedMarkdown = useRef(props.markdown);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: {
                    HTMLAttributes: { class: 'docs-code-block' },
                },
            }),
            Image.configure({ inline: false }),
            RemoteCursors,
        ],
        content: markdownToHtml(props.markdown),
        editorProps: {
            attributes: {
                class: cn('docs-editor-prose min-h-full px-8 py-10 outline-none'),
            },
        },
        onSelectionUpdate: ({ editor }) => props.onSelectionChange(editor.state.selection),
        onUpdate: ({ editor }) => {
            const markdown = editorJsonToMarkdown(editor.getJSON());
            appliedMarkdown.current = markdown;
            props.onMarkdownChange(markdown);
        },
    });

    useEffect(() => {
        if (!editor || props.markdown === appliedMarkdown.current) return;

        editor.commands.setContent(markdownToHtml(props.markdown), { emitUpdate: false });
        appliedMarkdown.current = props.markdown;
    }, [editor, props.document.id, props.markdown]);

    useEffect(() => {
        if (!editor) return;

        editor.view.dispatch(editor.state.tr.setMeta(remoteCursorKey, props.remoteSelections));
    }, [editor, props.remoteSelections]);

    return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <DocumentToolbar
                editor={editor}
                onSave={props.onSave}
                onUploadImage={props.onUploadImage}
                saveDisabled={props.saveDisabled}
                status={props.status}
            />
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-background">
                <EditorContent editor={editor} />
            </div>
        </section>
    );
}
