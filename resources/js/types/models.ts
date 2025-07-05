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

export interface Project {
    id: string;
    title: string;
    updated_at: string;
    tasks?: TraceboardTask[];
    [key: string]: unknown;
}
