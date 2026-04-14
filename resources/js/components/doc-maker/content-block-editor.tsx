import type React from 'react';

import { cn } from '@/lib/utils';
import { ContentBlock } from '@/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CodeBlockExample from './docs-code-block';

interface ContentBlockEditorProps {
    block: ContentBlock;
    sectionId?: string;
    onUpdate: (content: string) => void;
    onUpdateCalloutType?: (calloutType: string) => void;
    onDelete: () => void;
    canDelete: boolean;
}

export function ContentBlockEditor({ block, sectionId, onUpdate, onUpdateCalloutType }: ContentBlockEditorProps) {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: block.id,
        data: { type: 'Block', sectionId },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    } as React.CSSProperties;
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(block.content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing, value]);

    const handleBlur = () => {
        setIsEditing(false);
        onUpdate(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = value.substring(0, start) + '\t' + value.substring(end);
            setValue(newValue);

            // Move cursor after inserted tab
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }, 0);
        }
    };

    const calloutStyles = {
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
        success: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
        error: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    };
    const calloutTypes = ['info', 'warning', 'success', 'error'] as const;

    const renderBlock = () => {
        switch (block.type) {
            case 'text':
                return isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full resize-none bg-transparent leading-relaxed text-foreground outline-none"
                        rows={1}
                    />
                ) : (
                    <p onClick={() => setIsEditing(true)} className="cursor-text leading-relaxed whitespace-pre-wrap text-foreground">
                        {block.content || 'Click to add text...'}
                    </p>
                );

            case 'code':
                return isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full resize-none bg-transparent p-4 font-mono text-sm text-foreground outline-none"
                        rows={3}
                    />
                ) : (
                    <div onClick={() => setIsEditing(true)} className="cursor-text">
                        <CodeBlockExample
                            language={block.language || 'javascript'}
                            filename={`snippet.${block.language?.includes('ts') ? 'ts' : 'js'}`}
                            code={block.content || ''}
                        />
                    </div>
                );

            case 'image':
                return (
                    <div className="relative">
                        {block.imageUrl ? (
                            <img
                                src={block.imageUrl || '/placeholder.svg'}
                                alt={block.content || 'Documentation image'}
                                className="max-w-full rounded-lg"
                            />
                        ) : (
                            <div
                                onClick={() => setIsEditing(true)}
                                className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border transition-colors hover:border-primary/50"
                            >
                                <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Click to add image URL</p>
                            </div>
                        )}
                        {isEditing && (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Enter image URL..."
                                autoFocus
                                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                            />
                        )}
                    </div>
                );

            case 'callout':
                return (
                    <div className={cn('rounded-r-md border-l-4 px-4 py-3', calloutStyles[block.calloutType || 'info'])}>
                        {isEditing && (
                            <div className="mb-2 flex gap-2">
                                {calloutTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => onUpdateCalloutType?.(type)}
                                        className={cn(
                                            'rounded px-2 py-1 text-xs font-medium capitalize transition-colors',
                                            block.calloutType === type
                                                ? 'bg-foreground text-background'
                                                : 'border border-current opacity-50 hover:opacity-75',
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isEditing ? (
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-full resize-none bg-transparent outline-none"
                                rows={1}
                            />
                        ) : (
                            <p onClick={() => setIsEditing(true)} className="cursor-text">
                                {block.content || 'Click to add callout text...'}
                            </p>
                        )}
                    </div>
                );

            case 'divider':
                return <hr className="my-2 border-border" />;

            case 'list':
                return isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        placeholder="Enter items, one per line..."
                        className="w-full resize-none bg-transparent pl-6 leading-relaxed text-foreground outline-none"
                        rows={3}
                    />
                ) : (
                    <ul onClick={() => setIsEditing(true)} className="cursor-text list-inside list-disc space-y-1 text-foreground">
                        {(block.content || 'Item 1\nItem 2').split('\n').map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                    </ul>
                );

            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group relative rounded-lg transition-colors',

                block.type !== 'divider' && '-mx-2 p-2 hover:bg-accent/30',
                isDragging && 'opacity-60',
            )}
        >
            <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">{renderBlock()}</div>
            </div>
        </div>
    );
}
