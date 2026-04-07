import { XYPosition } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { CommunityPost, Template } from './models';

export interface Auth {
    user: User;
}

export type AppNotificationType = 'project_invite' | 'task_assigned' | 'subtask_assigned' | 'chat_mention';

export interface AppNotificationActor {
    id: number;
    name: string;
    avatar?: string | null;
}

export interface AppNotificationProject {
    id: string;
    title: string;
}

export interface AppNotificationSubject {
    id?: string | number | null;
    type?: string | null;
    title?: string | null;
}

export interface AppNotification {
    id: string;
    type: AppNotificationType;
    message: string;
    action_url: string;
    action_label: string;
    actor: AppNotificationActor;
    project: AppNotificationProject;
    subject?: AppNotificationSubject;
    context?: {
        invitation?: {
            id: string;
            status: string;
        };
        parent_task?: AppNotificationSubject;
    };
    read_at?: string | null;
    created_at?: string | null;
}

export interface NotificationFeed {
    items: AppNotification[];
    unread_count: number;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    notifications: NotificationFeed;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    flash?: {
        newTask?: unknown;
        updatedTask?: { image?: string | null };
        tag?: unknown;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    templates?: Template[];
    posts?: CommunityPost[];
    email_verified_at: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface screenToFlowPositionType {
    (
        clientPosition: XYPosition,
        options?: {
            snapToGrid: boolean;
        },
    ): XYPosition;
}

export interface ContentBlock {
    id: string;
    type: 'text' | 'code' | 'image' | 'callout' | 'divider' | 'list';
    content: string;
    language?: string;
    calloutType?: 'info' | 'warning' | 'success' | 'error';
    imageUrl?: string;
}

export interface Section {
    id: string;
    name: string;
    blocks: ContentBlock[];
}

export interface Page {
    id: string;
    name: string;
    sections: Section[];
}
