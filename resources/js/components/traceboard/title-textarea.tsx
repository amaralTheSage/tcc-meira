import { useEffect, useRef } from 'react';

interface TitleTextareaProps {
    title: string | undefined;
    setData: (field: 'title', value: string) => void;
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
    isNaming: boolean;
}

export default function TitleTextarea({ title, setData, onBlur, isNaming }: TitleTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setData('title', e.target.value);
        autoResize();
    };

    const autoResize = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (isNaming) {
            // BUG

            textareaRef.current?.focus();
            autoResize();
        }
    }, [isNaming]);

    return (
        <textarea
            name="title"
            id="title"
            maxLength={135}
            placeholder="Descreva a etapa do projeto..."
            value={title || ''}
            ref={textareaRef}
            onChange={handleInput}
            onBlur={onBlur}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    textareaRef.current?.blur();
                }
            }}
            rows={1}
            autoComplete="off"
            className="min-h-[40px] w-full resize-none overflow-hidden text-muted-foreground focus:outline-none"
        />
    );
}
