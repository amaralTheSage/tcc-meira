import ChatInput from '@/components/team-chat/chat-input';
import MessageArea from '@/components/team-chat/message-area';
import { emitEcho } from '@/test/echo';
import { buildChat, buildMessage, buildProject, buildUser } from '@/test/factories';
import { mockRouter, setMockPage } from '@/test/inertia';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

describe('team chat frontend', () => {
    it('sorts initial messages and appends Echo messages in timestamp order', () => {
        const older = buildMessage({ content: 'Older', created_at: '2026-01-01T09:00:00.000Z', id: 'old' });
        const newer = buildMessage({ content: 'Newer', created_at: '2026-01-01T11:00:00.000Z', id: 'new' });
        const middle = buildMessage({ content: 'Middle', created_at: '2026-01-01T10:00:00.000Z', id: 'mid' });
        const project = buildProject({ chat: buildChat([newer, older]) });

        render(<MessageArea project={project} />);
        act(() => emitEcho('private-chat', 'MessageAdded', { message: middle }));

        const messages = screen.getAllByTestId(/team-chat-message-/);
        expect(messages.map((message) => message.textContent)).toEqual([
            expect.stringContaining('Older'),
            expect.stringContaining('Middle'),
            expect.stringContaining('Newer'),
        ]);
    });

    it('submits message form data through Inertia', async () => {
        const user = userEvent.setup();
        const author = buildUser({ id: 42, name: 'Chat Author' });
        const project = buildProject({ chat: buildChat(), id: 'project-1' });
        setMockPage({ props: { auth: { user: author } }, url: '/project-1/team-chat' });

        render(<ChatInput project={project} />);

        await user.type(screen.getByTestId('team-chat-input'), 'Ready to ship');
        await user.click(screen.getByTestId('team-chat-send'));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/team-chat/message',
            {
                chat_id: project.chat?.id,
                content: 'Ready to ship',
                mentioned_user_ids: [],
                user_id: '42',
            },
            expect.objectContaining({ preserveScroll: false }),
        );
    });

    it('submits selected image messages as multipart form data', async () => {
        const user = userEvent.setup();
        const author = buildUser({ id: 42, name: 'Chat Author' });
        const project = buildProject({ chat: buildChat(), id: 'project-1' });
        const image = new File(['image-bytes'], 'chat.png', { type: 'image/png' });
        setMockPage({ props: { auth: { user: author } }, url: '/project-1/team-chat' });

        render(<ChatInput project={project} />);

        await user.click(screen.getByTestId('team-chat-attachment-trigger'));
        await user.click(screen.getByTestId('team-chat-image-trigger'));
        fireEvent.change(screen.getByTestId('team-chat-image-input'), { target: { files: [image] } });
        await user.type(screen.getByTestId('team-chat-input'), 'See attached');
        await user.click(screen.getByTestId('team-chat-send'));

        const formData = mockRouter.post.mock.calls[0][1] as FormData;
        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/team-chat/message',
            expect.any(FormData),
            expect.objectContaining({ forceFormData: true, preserveScroll: false }),
        );
        expect(formData.get('content')).toBe('See attached');
        expect(formData.get('image')).toBe(image);
    });

    it('submits selected chat mention ids', async () => {
        const user = userEvent.setup();
        const author = buildUser({ id: 42, name: 'Chat Author' });
        const mentionedUser = buildUser({ id: 7, name: 'Ada Lovelace' });
        const project = buildProject({ chat: buildChat(), id: 'project-1', members: [author, mentionedUser] });
        setMockPage({ props: { auth: { user: author } }, url: '/project-1/team-chat' });

        render(<ChatInput project={project} />);

        await user.type(screen.getByTestId('team-chat-input'), '@Ada');
        await user.click(screen.getByText('@Ada Lovelace'));
        await user.type(screen.getByTestId('team-chat-input'), 'please review');
        await user.click(screen.getByTestId('team-chat-send'));

        expect(mockRouter.post).toHaveBeenCalledWith(
            '/project-1/team-chat/message',
            expect.objectContaining({
                content: '@Ada Lovelace please review',
                mentioned_user_ids: [7],
            }),
            expect.objectContaining({ preserveScroll: false }),
        );
    });

    it('applies Echo message edits and deletes', () => {
        const original = buildMessage({ content: 'Original', id: 'message-1' });
        const updated = { ...original, content: 'Updated', edited_at: '2026-01-01T11:00:00.000Z' };
        const project = buildProject({ chat: buildChat([original]), id: 'project-1' });

        render(<MessageArea project={project} />);
        act(() => emitEcho('private-chat', 'MessageUpdated', { message: updated }));

        expect(screen.getByText('Updated')).toBeInTheDocument();

        act(() => emitEcho('private-chat', 'MessageDeleted', { messageId: 'message-1' }));

        expect(screen.queryByText('Updated')).not.toBeInTheDocument();
    });

    it('submits message edit and delete actions for the author', async () => {
        const user = userEvent.setup();
        const author = buildUser({ id: 42, name: 'Chat Author' });
        const message = buildMessage({ content: 'Original', id: 'message-1', user: author });
        const project = buildProject({ chat: buildChat([message]), id: 'project-1' });
        setMockPage({ props: { auth: { user: author } }, url: '/project-1/team-chat' });

        render(<MessageArea project={project} />);

        await user.click(screen.getByLabelText('Edit message'));
        await user.clear(screen.getByDisplayValue('Original'));
        await user.type(screen.getByDisplayValue(''), 'Edited');
        await user.click(screen.getByLabelText('Save message edit'));

        expect(mockRouter.patch).toHaveBeenCalledWith('/project-1/team-chat/messages/message-1', { content: 'Edited' }, { preserveScroll: true });

        await user.click(screen.getByLabelText('Delete message'));

        expect(mockRouter.delete).toHaveBeenCalledWith('/project-1/team-chat/messages/message-1', { preserveScroll: true });
    });

    it('shows a toast instead of submitting when the project has no chat', async () => {
        const user = userEvent.setup();
        setMockPage({ props: { auth: { user: buildUser({ id: 1 }) } }, url: '/project-1/team-chat' });

        render(<ChatInput project={buildProject({ chat: undefined })} />);

        await user.click(screen.getByTestId('team-chat-send'));

        expect(mockRouter.post).not.toHaveBeenCalled();
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Project chat is not available.');
    });
});
