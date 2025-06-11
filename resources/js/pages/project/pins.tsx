import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pins',
        href: '/pins',
    },
];

export default function Pins({project}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Pins" />
        </AppLayout>
    );
}
