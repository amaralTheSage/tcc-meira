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
    completed: boolean;
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
    
    [key: string]: unknown;
}

export interface Column {
    id: string;
    name?: string;
    position: number;
    tasks?: ColumnTask[];

    [key: string]: unknown;
}
