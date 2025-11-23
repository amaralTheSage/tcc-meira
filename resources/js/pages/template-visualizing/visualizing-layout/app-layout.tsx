import { Toaster } from '@/components/ui/sonner';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import Banner from '../components/banner';
import AppLayoutTemplate from './app-sidebar-layout';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, project, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props} project={project}>
        <Banner />
        {children}
        <Toaster />
    </AppLayoutTemplate>
);
