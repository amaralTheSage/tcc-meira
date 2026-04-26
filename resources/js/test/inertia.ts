import type React from 'react';
import { vi } from 'vitest';

type RouteParams = number | string | Record<string, unknown>;
type FormOptions = Record<string, unknown>;

interface MockPage {
    props: Record<string, unknown>;
    url: string;
}

interface MockLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    as?: string;
    cacheFor?: string;
    href: string;
    prefetch?: boolean;
}

interface MockHeadProps {
    title?: string;
}

const defaultPage: MockPage = {
    props: {
        auth: {
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                avatar: '',
                email_verified_at: null,
            },
        },
        notifications: {
            items: [],
            unread_count: 0,
        },
    },
    url: '/',
};

export const mockRouter = {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    reload: vi.fn(),
};

let mockPage: MockPage = { ...defaultPage };

export function resetInertiaMocks(): void {
    mockRouter.delete.mockReset();
    mockRouter.get.mockReset();
    mockRouter.patch.mockReset();
    mockRouter.post.mockReset();
    mockRouter.reload.mockReset();
    mockPage = { ...defaultPage, props: { ...defaultPage.props } };
}

export function setMockPage(page: Partial<MockPage>): void {
    mockPage = {
        props: page.props ?? mockPage.props,
        url: page.url ?? mockPage.url,
    };
}

export function mockRoute(name: string, params?: RouteParams): string {
    const project = projectParam(params);
    const routes: Record<string, string> = {
        'column.destroy': `/${project}/column/delete/${resourceParam(params, 'column')}`,
        'column.reorder': `/${project}/kanban/columns/reorder`,
        'column.store': `/${project}/kanban/column`,
        'column.update': `/${project}/column/update/${resourceParam(params, 'column')}`,
        docs: `/${project}/docs`,
        'docs.assets.store': `/${project}/docs/${resourceParam(params, 'document')}/assets`,
        'docs.content.update': `/${project}/docs/${resourceParam(params, 'document')}/content`,
        'docs.destroy': `/${project}/docs/${resourceParam(params, 'document')}`,
        'docs.show': `/${project}/docs/${resourceParam(params, 'document')}`,
        'docs.store': `/${project}/docs`,
        'docs.update': `/${project}/docs/${resourceParam(params, 'document')}`,
        home: '/home',
        kanban: `/${project}/kanban`,
        'message.destroy': `/${project}/team-chat/messages/${resourceParam(params, 'message')}`,
        'message.store': `/${project}/team-chat/message`,
        'message.update': `/${project}/team-chat/messages/${resourceParam(params, 'message')}`,
        'notifications.read': `/notifications/${resourceParam(params, 'notification')}/read`,
        'notifications.read-all': '/notifications/read-all',
        'pins.store': `/${project}/pins`,
        pins: `/${project}/pins`,
        'project-invitations.accept': `/project-invitations/${resourceParam(params, 'invitation')}/accept`,
        'project-invitations.decline': `/project-invitations/${resourceParam(params, 'invitation')}/decline`,
        'project-settings': `/${project}/project-settings`,
        'projects.store': '/projects',
        'sprint.attach-tasks': `/sprints/${resourceParam(params, 'sprint')}/attach-tasks`,
        'sprint.complete': `/sprints/${resourceParam(params, 'sprint')}/complete`,
        'sprint.index': `/${project}/sprint`,
        'sprint.start': `/sprints/${resourceParam(params, 'sprint')}/start`,
        'sprint.store': `/${project}/sprint`,
        'subtasks.store': `/${project}/kanban/subtasks`,
        'tasks.destroy': `/${project}/delete-task/${resourceParam(params, 'task_id')}`,
        'tasks.store': `/${project}/traceboard/tasks`,
        'tasks.update': `/${project}/update-task/${resourceParam(params, 'task')}`,
        'team-chat': `/${project}/team-chat`,
        traceboard: `/${project}/traceboard`,
    };

    return routes[name] ?? `/${name}`;
}

export function createInertiaReactMock(react: typeof React): Record<string, unknown> {
    return {
        Head: (_props: MockHeadProps) => null,
        Link: ({ as: _as, cacheFor: _cacheFor, href, prefetch: _prefetch, ...props }: MockLinkProps) =>
            react.createElement('a', { ...props, href }, props.children),
        router: mockRouter,
        useForm: createUseForm(react),
        usePage: <TProps extends Record<string, unknown>>() => mockPage as { props: TProps; url: string },
    };
}

function createUseForm(react: typeof React) {
    return function useForm<TData extends Record<string, unknown>>(initialData?: TData) {
        const [data, updateData] = react.useState<TData>((initialData ?? {}) as TData);

        const setData = (keyOrData: keyof TData | TData, value?: TData[keyof TData]): void => {
            if (typeof keyOrData === 'object') {
                updateData(keyOrData);
                return;
            }

            updateData((current) => ({ ...current, [keyOrData]: value }));
        };

        return {
            data,
            delete: (url: string, options?: FormOptions) => mockRouter.delete(url, options),
            errors: {},
            patch: (url: string, options?: FormOptions) => mockRouter.patch(url, data, options),
            post: (url: string, options?: FormOptions) => mockRouter.post(url, data, options),
            processing: false,
            reset: () => updateData((initialData ?? {}) as TData),
            setData,
        };
    };
}

function projectParam(params?: RouteParams): string {
    if (typeof params === 'number' || typeof params === 'string') {
        return String(params);
    }

    return String(params?.project ?? 'project-1');
}

function resourceParam(params: RouteParams | undefined, key: string): string {
    if (typeof params === 'number' || typeof params === 'string') {
        return String(params);
    }

    const value = params?.[key];
    if (isRoutableObject(value)) {
        return String(value.id);
    }

    return String(value ?? key);
}

function isRoutableObject(value: unknown): value is { id: number | string } {
    return typeof value === 'object' && value !== null && 'id' in value;
}
