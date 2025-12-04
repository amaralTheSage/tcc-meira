import { UUID } from 'crypto';
import { User } from '.';

export interface queueOperation {
    (ops: { type: string; task: { id: string; [key: string]: unknown } }): void;
}

export interface Pinned {
    id: number;
    title?: string;
    url?: string;
    text?: string;
    position: number;

    [key: string]: unknown;
}

export interface TraceboardTask {
    id: string;
    title?: string;
    image?: string;
    status: 'pending' | 'in_progress' | 'completed';
    x: number;
    y: number;
    queueOperation: queueOperation;
    removePendingOpsForTask: (taskId: string) => void;

    [key: string]: unknown;
}

export interface TraceboardNote {
    id: string;
    text?: string;
    x: number;
    y: number;

    [key: string]: unknown;
}

export interface Project {
    id: UUID;
    title: string;
    updated_at: string;
    tasks?: TraceboardTask[];
    notes?: TraceboardNote[];
    members: User[];
    chat: Chat;
    edge_type: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
    animated_edges: boolean;
    [key: string]: unknown;
}

export interface CommunityPost {
    id: string;
    images: File[] | string[];
    title: string;
    description: string;
    members: User[];
    [key: string]: unknown;
}

export interface ColumnTask {
    id: string;
    title?: string;
    description?: string;
    position: number;
    image?: string;
    subtasks: TaskSubtask[];
    tags?: Tag[];
    users?: User[];
    created_at: string;

    [key: string]: unknown;
}

export interface Subtask {
    id: string;
    task_id: string;
    title?: string;
    description?: string;
    image?: string;
    completed: boolean;

    [key: string]: unknown;
}

export interface TaskSubtask {
    id: string;
    title?: string;

    [key: string]: unknown;
}
export interface Column {
    id: string;
    name?: string;
    position: number;
    tasks?: ColumnTask[];
    type: string;

    [key: string]: unknown;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Chat {
    id: string;
    messages: Message[];

    [key: string]: unknown;
}

export interface Message {
    id: string;
    content: string;
    user: User;
    created_at: string;

    [key: string]: unknown;
}

export interface Template {
    id: number;
    name: string;
    data: {
        pins: Pinned[];
        columns: Column[];
        tasks: TraceboardTask[];
        subtasks: Subtask[];
        [key: string]: unknown;
    };
    user: User;

    [key: string]: unknown;
}
