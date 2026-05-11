import { User } from '.';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type EdgeTypeName = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier';
export type ProjectVisibility = 'private' | 'link_only' | 'public';
export type ProjectInvitationStatus = 'pending' | 'accepted' | 'declined';

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
    visibility?: ProjectVisibility;
    share_token?: string | null;
    share_url?: string | null;
    public_views_count?: number;
    published_at?: string | null;
    created_at?: string;
    updated_at?: string;
    tasks?: TraceboardTask[];
    notes?: TraceboardNote[];
    sprints?: Sprint[];
    members: User[];
    invitations?: ProjectInvitation[];
    tags?: Tag[];
    chat?: Chat;
    documents?: ProjectDocument[];
    edge_type: EdgeTypeName;
    animated_edges: boolean;
    publication?: SharedPublication;
}

export interface ProjectDocument {
    id: string;
    project_id: string;
    title: string;
    markdown: string;
    version: number;
    last_edited_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface ProjectDocumentAsset {
    id: string;
    project_document_id: string;
    disk: string;
    path: string;
    original_name: string;
    mime_type?: string | null;
    size: number;
    uploaded_by?: number | null;
}

export interface CommunityPost {
    id?: string;
    project_id?: string;
    images?: CommunityPostImage[];
    preview?: CommunityPostPreview;
    title: string;
    description: string;
    members: User[];
    share_url?: string;
    public_views_count?: number;
    published_at?: string | null;
}

export interface CommunityPostImage {
    id?: number;
    image_id?: string;
    url: string;
}

export interface CommunityPostPreview {
    tasks: CommunityPostPreviewTask[];
    notes: CommunityPostPreviewNote[];
    edge_type: EdgeTypeName;
    animated_edges: boolean;
}

export interface CommunityPostPreviewTask {
    id: string;
    title?: string | null;
    image?: string | null;
    status?: TaskStatus | null;
    sprint?: CommunityPostPreviewSprint | null;
    subtasks_completed: number;
    subtasks_total: number;
    x?: number | null;
    y?: number | null;
    target_ids: string[];
}

export interface CommunityPostPreviewSprint {
    id: string;
    title: string;
    color: string;
}

export interface CommunityPostPreviewNote {
    id: string;
    text?: string | null;
    x?: number | null;
    y?: number | null;
}

export interface ProjectInvitation {
    id: number;
    project_id: string;
    inviter_id: number;
    invitee_id: number;
    status: ProjectInvitationStatus;
    accepted_at?: string | null;
    declined_at?: string | null;
    invitee?: User;
    created_at?: string;
    updated_at?: string;
}

export interface SharedPublication {
    title: string;
    description?: string | null;
    images: CommunityPostImage[];
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

export interface TemplateTask {
    id: string;
    title?: string;
    description?: string | null;
    image?: string | null;
    position?: number;
    project_id?: string;
    status?: TaskStatus | string;
    sprint_id?: string | number | null;
    column_id?: string | number | null;
    x?: number;
    y?: number;
    subtasks?: TaskSubtask[];
    tags?: Tag[];
    users?: User[];
    created_at?: string;
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
        tasks: TemplateTask[];
        sprints?: Sprint[];
        documents?: ProjectDocument[];
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
    color: string;
    tasks?: ColumnTask[];
}
