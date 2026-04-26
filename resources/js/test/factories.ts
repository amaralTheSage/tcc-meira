import type { User } from '@/types';
import type { Chat, Column, ColumnTask, Message, Pinned, Project, Sprint, Tag, TaskSubtask, Template } from '@/types/models';

let sequence = 1;

export function buildUser(overrides: Partial<User> = {}): User {
    const id = overrides.id ?? sequence++;

    return {
        avatar: undefined,
        email: `user-${id}@example.com`,
        email_verified_at: null,
        id,
        name: `User ${id}`,
        ...overrides,
    };
}

export function buildProject(overrides: Partial<Project> = {}): Project {
    return {
        animated_edges: false,
        edge_type: 'default',
        id: `project-${sequence++}`,
        members: [buildUser()],
        title: 'Project Atlas',
        ...overrides,
    };
}

export function buildTag(overrides: Partial<Tag> = {}): Tag {
    return {
        color: '#991b1b',
        id: `tag-${sequence++}`,
        name: 'Backend',
        ...overrides,
    };
}

export function buildSubtask(overrides: Partial<TaskSubtask> = {}): TaskSubtask {
    return {
        completed: false,
        id: `subtask-${sequence++}`,
        title: 'Write acceptance checks',
        users: [],
        ...overrides,
    };
}

export function buildTask(overrides: Partial<ColumnTask> = {}): ColumnTask {
    return {
        created_at: '2026-01-02T03:04:05.000Z',
        id: `task-${sequence++}`,
        position: 1,
        status: 'pending',
        subtasks: [],
        title: 'Draft release plan',
        users: [],
        ...overrides,
    };
}

export function buildColumn(overrides: Partial<Column> = {}): Column {
    return {
        id: `column-${sequence++}`,
        name: 'Backlog',
        position: 1,
        tasks: [],
        type: 'standard',
        ...overrides,
    };
}

export function buildSprint(overrides: Partial<Sprint> = {}): Sprint {
    return {
        end_at: '2026-01-15T00:00:00.000Z',
        id: `sprint-${sequence++}`,
        project_id: 'project-1',
        start_at: '2026-01-01T00:00:00.000Z',
        status: 'planned',
        title: 'Sprint 1',
        ...overrides,
    };
}

export function buildPin(overrides: Partial<Pinned> = {}): Pinned {
    return {
        id: `pin-${sequence++}`,
        position: 1,
        text: 'Release checklist',
        ...overrides,
    };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
    return {
        content: 'Hello team',
        created_at: '2026-01-01T10:00:00.000Z',
        id: `message-${sequence++}`,
        user: buildUser(),
        ...overrides,
    };
}

export function buildChat(messages: Message[] = []): Chat {
    return {
        id: `chat-${sequence++}`,
        messages,
    };
}

export function buildTemplate(overrides: Partial<Template> = {}): Template {
    return {
        data: {
            columns: [],
            pins: [],
            task_connections: [],
            tasks: [],
        },
        id: `template-${sequence++}`,
        name: 'Launch Template',
        user: buildUser(),
        ...overrides,
    };
}
