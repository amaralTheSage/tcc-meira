import { ProjectDocsWorkspace } from '@/components/project-docs/docs-workspace';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Project, ProjectDocument } from '@/types/models';
import { Head } from '@inertiajs/react';

interface DocsProps {
    activeDocument: ProjectDocument;
    documents: ProjectDocument[];
    project: Project;
}

export default function Docs({ activeDocument, documents, project }: DocsProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Docs',
            href: route('docs', { project: project.id }),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Docs" />
            <ProjectDocsWorkspace activeDocument={activeDocument} documents={documents} project={project} />
        </AppLayout>
    );
}
