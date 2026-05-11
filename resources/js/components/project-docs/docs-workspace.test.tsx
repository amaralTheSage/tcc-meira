import { colorForUser, ProjectDocsWorkspace } from '@/components/project-docs/docs-workspace';
import { emitEcho } from '@/test/echo';
import { buildProject, buildProjectDocument, buildUser } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/project-docs/document-editor', async () => {
    const react = await import('react');
    let draftNumber = 0;

    return {
        DocumentEditor: (props: { onMarkdownChange: (markdown: string) => void; onSave: () => void; saveDisabled: boolean; status: string }) =>
            react.createElement(
                'section',
                {},
                react.createElement('button', { onClick: () => props.onMarkdownChange(`# Draft ${++draftNumber}\n`), type: 'button' }, 'Type draft'),
                react.createElement('button', { disabled: props.saveDisabled, onClick: props.onSave, type: 'button' }, 'Mock save'),
                react.createElement('span', {}, props.status),
            ),
    };
});

describe('ProjectDocsWorkspace', () => {
    it('creates and renames project documents through scoped routes', async () => {
        const user = userEvent.setup();
        const { document, project } = docsFixture();
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);

        await user.click(screen.getByRole('button', { name: 'New document' }));
        await user.type(screen.getByLabelText('New document title'), 'Runbook');
        await user.click(screen.getByRole('button', { name: 'Create document' }));
        await user.clear(screen.getByLabelText('Document title'));
        await user.type(screen.getByLabelText('Document title'), 'Updated Docs');
        await user.tab();

        expect(mockRouter.post).toHaveBeenCalledWith(`/${project.id}/docs`, { title: 'Runbook' });
        expect(mockRouter.patch).toHaveBeenCalledWith(`/${project.id}/docs/${document.id}`, { title: 'Updated Docs' });
    });

    it('keeps document identity controls in the sidebar only', () => {
        const { document, project } = docsFixture();
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);

        expect(screen.getByLabelText('Document title')).toHaveClass('text-sm');
        expect(screen.queryByText('Editing document')).not.toBeInTheDocument();
    });

    it('does not repeat a documents heading above the new document button', () => {
        const { document, project } = docsFixture();
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);

        expect(screen.queryByText('Documents')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New document' })).toBeInTheDocument();
    });

    it('applies remote document saves from the Reverb presence channel', () => {
        const { document, project } = docsFixture();
        const updatedDocument = { ...document, markdown: '# Updated\n', title: 'Updated', version: 2 };
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);
        act(() => emitEcho(`project.${project.id}.docs.${document.id}`, 'ProjectDocumentSaved', { document: updatedDocument, editor: buildUser() }));

        expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    });

    it('accepts remote saves that match the current local draft', () => {
        const { document, project } = docsFixture();
        const updatedDocument = { ...document, markdown: '# Draft 1\n', version: 2 };
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);
        fireEvent.click(screen.getByRole('button', { name: 'Type draft' }));
        act(() =>
            emitEcho(`project.${project.id}.docs.${document.id}`, 'ProjectDocumentSaved', {
                document: updatedDocument,
                editor: buildUser({ id: 2 }),
            }),
        );

        expect(screen.queryByText(/Remote changes were saved/)).not.toBeInTheDocument();
        expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('waits for an in-flight autosave before sending the next draft', async () => {
        vi.useFakeTimers();
        try {
            const { document, project } = docsFixture();
            const firstSave = deferredResponse();
            const fetchMock = vi
                .fn()
                .mockReturnValueOnce(firstSave.promise)
                .mockResolvedValueOnce(jsonDocumentResponse({ ...document, markdown: '# Draft 2\n', version: 3 }));
            setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });
            vi.stubGlobal('fetch', fetchMock);

            render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);
            fireEvent.click(screen.getByRole('button', { name: 'Type draft' }));
            act(() => vi.advanceTimersByTime(900));
            fireEvent.click(screen.getByRole('button', { name: 'Type draft' }));
            act(() => vi.advanceTimersByTime(1000));

            expect(fetchMock).toHaveBeenCalledTimes(1);
            await act(async () => {
                firstSave.resolve(jsonDocumentResponse({ ...document, markdown: '# Draft 1\n', version: 2 }));
                await Promise.resolve();
                await Promise.resolve();
            });
            act(() => vi.advanceTimersByTime(900));

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(fetchJsonBody(fetchMock, 1)).toMatchObject({ base_version: 2 });
            expect(fetchJsonBody(fetchMock, 1).markdown).not.toBe(fetchJsonBody(fetchMock, 0).markdown);
        } finally {
            vi.unstubAllGlobals();
            vi.useRealTimers();
        }
    });

    it('confirms deletion in a dialog when another document remains', async () => {
        const user = userEvent.setup();
        const { document, project } = docsFixture();
        const secondDocument = buildProjectDocument({ id: 'document-2', project_id: project.id, title: 'Runbook' });
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document, secondDocument]} project={project} />);

        await user.click(screen.getByTitle('Delete document'));
        expect(screen.getByRole('dialog', { name: 'Delete document?' })).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Delete file' }));

        expect(mockRouter.delete).toHaveBeenCalledWith(`/${project.id}/docs/${document.id}`);
    });

    it('assigns stable collaborator colors', () => {
        expect(colorForUser(1)).toBe('#14b8a6');
        expect(colorForUser(7)).toBe('#14b8a6');
    });
});

function docsFixture(): { document: ReturnType<typeof buildProjectDocument>; project: ReturnType<typeof buildProject> } {
    const project = buildProject({ id: 'project-1' });
    const document = buildProjectDocument({ id: 'document-1', project_id: project.id });

    return { document, project };
}

function deferredResponse(): { promise: Promise<Response>; resolve: (response: Response) => void } {
    let resolveResponse = (_response: Response): void => {};
    const promise = new Promise<Response>((resolve) => {
        resolveResponse = resolve;
    });

    return { promise, resolve: resolveResponse };
}

function fetchJsonBody(fetchMock: ReturnType<typeof vi.fn>, callIndex: number): { base_version: number; markdown: string } {
    const options = fetchMock.mock.calls[callIndex]?.[1] as RequestInit;

    return JSON.parse(String(options.body)) as { base_version: number; markdown: string };
}

function jsonDocumentResponse(document: ReturnType<typeof buildProjectDocument>): Response {
    const headers = { 'Content-Type': 'application/json' };

    return new Response(JSON.stringify({ document }), { headers, status: 200 });
}
