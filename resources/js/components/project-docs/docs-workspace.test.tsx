import { colorForUser, ProjectDocsWorkspace } from '@/components/project-docs/docs-workspace';
import { buildProject, buildProjectDocument, buildUser } from '@/test/factories';
import { emitEcho } from '@/test/echo';
import { mockRouter, setMockPage } from '@/test/inertia';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('ProjectDocsWorkspace', () => {
    it('creates and renames project documents through scoped routes', async () => {
        const user = userEvent.setup();
        const { document, project } = docsFixture();
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);

        await user.type(screen.getByPlaceholderText('New document'), 'Runbook');
        await user.click(screen.getByTitle('Create document'));
        await user.clear(screen.getByLabelText('Document title'));
        await user.type(screen.getByLabelText('Document title'), 'Updated Docs');
        await user.tab();

        expect(mockRouter.post).toHaveBeenCalledWith(`/${project.id}/docs`, { title: 'Runbook' });
        expect(mockRouter.patch).toHaveBeenCalledWith(`/${project.id}/docs/${document.id}`, { title: 'Updated Docs' });
    });

    it('applies remote document saves from the Reverb presence channel', () => {
        const { document, project } = docsFixture();
        const updatedDocument = { ...document, markdown: '# Updated\n', title: 'Updated', version: 2 };
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document]} project={project} />);
        act(() => emitEcho(`project.${project.id}.docs.${document.id}`, 'ProjectDocumentSaved', { document: updatedDocument, editor: buildUser() }));

        expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    });

    it('deletes only when another document remains', async () => {
        const user = userEvent.setup();
        const { document, project } = docsFixture();
        const secondDocument = buildProjectDocument({ id: 'document-2', project_id: project.id, title: 'Runbook' });
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: `/${project.id}/docs` });

        render(<ProjectDocsWorkspace activeDocument={document} documents={[document, secondDocument]} project={project} />);

        await user.click(screen.getByTitle('Delete document'));

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
