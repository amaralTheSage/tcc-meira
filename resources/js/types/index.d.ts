import { XYPosition } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';
import { CommunityPost, Template } from './models';

export interface Auth {
    user: User;
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
