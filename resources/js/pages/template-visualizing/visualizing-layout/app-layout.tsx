import { Toaster } from '@/components/ui/sonner';
import { type BreadcrumbItem } from '@/types';
import type { Project } from '@/types/models';
import { type ReactNode } from 'react';
import Banner from '../components/banner';
import AppLayoutTemplate from './app-sidebar-layout';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    project: Project;
}

export default function TemplateAppLayout({ children, breadcrumbs, project }: AppLayoutProps) {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} project={project}>
            <Banner />
            {children}
            <Toaster />
        </AppLayoutTemplate>
    );
}
