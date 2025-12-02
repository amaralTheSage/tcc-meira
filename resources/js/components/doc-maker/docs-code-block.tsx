import type { BundledLanguage } from './code-block';
import {
    CodeBlock,
    CodeBlockBody,
    CodeBlockContent,
    CodeBlockCopyButton,
    CodeBlockFilename,
    CodeBlockFiles,
    CodeBlockHeader,
    CodeBlockItem,
    CodeBlockSelect,
    CodeBlockSelectContent,
    CodeBlockSelectItem,
    CodeBlockSelectTrigger,
    CodeBlockSelectValue,
} from './code-block';

interface CodeBlockExampleProps {
    language: string;
    filename?: string;
    code: string;
}

export default function DocsCodeBlock({ language, filename, code }: CodeBlockExampleProps) {
    const data = [
        {
            language: language || 'javascript',
            filename: filename || `snippet.${language?.includes('ts') ? 'ts' : 'js'}`,
            code: code || '',
        },
    ];

    return (
        <CodeBlock data={data} defaultValue={data[0].language}>
            <CodeBlockHeader>
                <CodeBlockFiles>
                    {(item) => (
                        <CodeBlockFilename key={item.language} value={item.language}>
                            {item.filename}
                        </CodeBlockFilename>
                    )}
                </CodeBlockFiles>
                <CodeBlockSelect>
                    <CodeBlockSelectTrigger>
                        <CodeBlockSelectValue />
                    </CodeBlockSelectTrigger>
                    <CodeBlockSelectContent>
                        {(item) => (
                            <CodeBlockSelectItem key={item.language} value={item.language}>
                                {item.language}
                            </CodeBlockSelectItem>
                        )}
                    </CodeBlockSelectContent>
                </CodeBlockSelect>
                <CodeBlockCopyButton
                    onCopy={() => console.log('Copied code to clipboard')}
                    onError={() => console.error('Failed to copy code to clipboard')}
                />
            </CodeBlockHeader>
            <CodeBlockBody>
                {(item) => (
                    <CodeBlockItem key={item.language} value={item.language}>
                        <CodeBlockContent language={item.language as BundledLanguage}>{item.code}</CodeBlockContent>
                    </CodeBlockItem>
                )}
            </CodeBlockBody>
        </CodeBlock>
    );
}
