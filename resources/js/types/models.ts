import { User } from '.';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type EdgeTypeName = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';

export interface BoardOperation {
    type: string;
    task?: {
        id?: string;
        title?: string;
        image?: string | null;
        text?: string;
        x?: number;
        y?: number;
    };
    connection?: {
        source_id: string | null;
        target_id: string | null;
    };
}

export interface QueueOperation {
    (operation: BoardOperation): void;
}

export interface Pinned {
    id: string;
    title?: string;
    url?: string;
    text?: string;
    position: number;
    x?: number;
    y?: number;
}

export interface TraceboardTask {
    id: string;
    title?: string;
    image?: string;
    status: TaskStatus;
    sprint_id?: string;
    x: number;
    y: number;
    queueOperation: QueueOperation;
    removePendingOpsForTask: (taskId: string) => void;
    tags?: Tag[];
    sources?: TraceboardConnectionTask[];
    targets?: TraceboardConnectionTask[];
}

export interface TraceboardConnectionTask {
    id: string;
    status?: TaskStatus;
    data?: {
        completed?: boolean;
    };
    pivot: {
        source_id: string;
        target_id: string;
    };
}

export interface TraceboardNote {
    id: string;
    text?: string;
    x: number;
    y: number;
}

export interface Project {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
    tasks?: TraceboardTask[];
    notes?: TraceboardNote[];
    sprints?: Sprint[];
    members: User[];
    tags?: Tag[];
    chat?: Chat;
    edge_type: EdgeTypeName;
    animated_edges: boolean;
}

export interface CommunityPost {
    id?: string;
    images?: File[] | string[];
    img?: string;
    title: string;
    description: string;
    members: User[];
}

export interface ColumnTask {
    id: string;
    title?: string;
    description?: string;
    position: number;
    project_id?: string;
    status?: TaskStatus;
    sprint_id?: string;
    image?: string;
    subtasks: TaskSubtask[];
    tags?: Tag[];
    users?: User[];
    created_at: string;
}

export interface Subtask {
    id: string;
    task_id: string;
    title?: string;
    description?: string;
    image?: string;
    completed: boolean;
}

export interface TaskSubtask {
    id: string;
    title?: string;
    users: User[];
    completed: boolean;
}
export interface Column {
    id: string;
    name?: string;
    position: number;
    tasks?: ColumnTask[];
    type: string;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Chat {
    id: string;
    messages: Message[];
}

export interface Message {
    id: string;
    content: string;
    image?: string;
    user: User;
    created_at: string;
    edited_at?: string | null;
}

export interface TemplateTaskConnection {
    source_id: string;
    target_id: string;
}

export interface Template {
    id: string;
    name: string;
    data: {
        pins: Pinned[];
        columns: Column[];
        tasks: TraceboardTask[];
        notes?: TraceboardNote[];
        subtasks?: Subtask[];
        task_connections?: TemplateTaskConnection[];
    };
    user: User;
}

export interface Sprint {
    id: string;
    title: string;
    project_id: string;
    start_at: string;
    end_at: string;
    status: 'planned' | 'active' | 'completed';
    goal?: string;
    tasks?: ColumnTask[];
}
