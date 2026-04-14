import type { JSONContent } from '@tiptap/core';
import MarkdownIt from 'markdown-it';

const markdownRenderer = new MarkdownIt({
    breaks: false,
    html: false,
    linkify: true,
});

export function markdownToHtml(markdown: string): string {
    return markdownRenderer.render(markdown);
}

export function editorJsonToMarkdown(document: JSONContent): string {
    const markdown = renderChildren(document).trimEnd();

    return markdown === '' ? '' : `${markdown}\n`;
}

function renderNode(node: JSONContent, index: number): string {
    const renderers: Record<string, (node: JSONContent, index: number) => string> = {
        blockquote: renderBlockquote,
        bulletList: renderBulletList,
        codeBlock: renderCodeBlock,
        hardBreak: () => '\n',
        heading: renderHeading,
        horizontalRule: () => '\n---\n\n',
        image: renderImage,
        listItem: renderListItem,
        orderedList: renderOrderedList,
        paragraph: renderParagraph,
        text: renderText,
    };

    return renderers[node.type ?? '']?.(node, index) ?? renderChildren(node);
}

function renderChildren(node: JSONContent): string {
    return (node.content ?? []).map(renderNode).join('');
}

function renderParagraph(node: JSONContent): string {
    return `${renderChildren(node)}\n\n`;
}

function renderHeading(node: JSONContent): string {
    const level = Number(node.attrs?.level ?? 1);
    const marker = '#'.repeat(Math.min(Math.max(level, 1), 6));

    return `${marker} ${renderChildren(node)}\n\n`;
}

function renderBlockquote(node: JSONContent): string {
    const body = renderChildren(node).trimEnd();
    const quoted = body.split('\n').map((line) => `> ${line}`).join('\n');

    return `${quoted}\n\n`;
}

function renderCodeBlock(node: JSONContent): string {
    const language = typeof node.attrs?.language === 'string' ? node.attrs.language : '';
    const code = collectText(node).replace(/\n$/, '');

    return `\`\`\`${language}\n${code}\n\`\`\`\n\n`;
}

function renderBulletList(node: JSONContent): string {
    return renderList(node, false);
}

function renderOrderedList(node: JSONContent): string {
    return renderList(node, true);
}

function renderList(node: JSONContent, ordered: boolean): string {
    const items = (node.content ?? []).map((item, index) => {
        const prefix = ordered ? `${index + 1}. ` : '- ';

        return `${prefix}${renderListItem(item, index)}`;
    });

    return `${items.join('\n')}\n\n`;
}

function renderListItem(node: JSONContent, _index: number): string {
    return renderChildren(node).trim().replace(/\n/g, '\n  ');
}

function renderImage(node: JSONContent): string {
    const src = String(node.attrs?.src ?? '');
    const alt = String(node.attrs?.alt ?? '');

    return src === '' ? '' : `![${alt}](${src})\n\n`;
}

function renderText(node: JSONContent): string {
    return applyMarks(node.text ?? '', node.marks ?? []);
}

function applyMarks(text: string, marks: NonNullable<JSONContent['marks']>): string {
    return marks.reduce((value, mark) => wrapMark(value, mark), text);
}

function wrapMark(text: string, mark: NonNullable<JSONContent['marks']>[number]): string {
    if (mark.type === 'bold') return `**${text}**`;
    if (mark.type === 'italic') return `*${text}*`;
    if (mark.type === 'strike') return `~~${text}~~`;
    if (mark.type === 'code') return `\`${text}\``;
    if (mark.type === 'link') return `[${text}](${mark.attrs?.href ?? ''})`;

    return text;
}

function collectText(node: JSONContent): string {
    if (node.type === 'text') {
        return node.text ?? '';
    }

    return (node.content ?? []).map(collectText).join('');
}
