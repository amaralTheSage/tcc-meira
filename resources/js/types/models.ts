export interface TraceboardTask {
    id: string;
    title?: string;
    image?: string;
    x: number;
    y: number;
    [key: string]: unknown;
}

export interface Project {
    id: string;
    title: string;
    updated_at: string;
    [key: string]: unknown;
}
