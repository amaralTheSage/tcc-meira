import { editorJsonToMarkdown, markdownToHtml } from '@/lib/docs-markdown';
import type { JSONContent } from '@tiptap/core';
import { describe, expect, it } from 'vitest';

describe('docs markdown helpers', () => {
    it('renders markdown without allowing raw html', () => {
        const html = markdownToHtml('# Title\n\n<script>alert("x")</script>');

        expect(html).toContain('<h1>Title</h1>');
        expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    });

    it('serializes common editor nodes back to markdown', () => {
        const document: JSONContent = {
            type: 'doc',
            content: [
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Setup' }] },
                { type: 'paragraph', content: [{ type: 'text', text: 'Ship', marks: [{ type: 'bold' }] }] },
                { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Test' }] }] }] },
                { type: 'codeBlock', attrs: { language: 'php' }, content: [{ type: 'text', text: 'php artisan test' }] },
            ],
        };

        expect(editorJsonToMarkdown(document)).toBe("## Setup\n\n**Ship**\n\n- Test\n\n```php\nphp artisan test\n```\n");
    });
});
