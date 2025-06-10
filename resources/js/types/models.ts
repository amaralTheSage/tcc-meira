export interface TraceboardTask {
    id: string;
    title?: string;
    image?: string;
    x: number;
    y: number;
    [key: string]: unknown;
}
