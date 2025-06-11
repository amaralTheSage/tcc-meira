import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Feed',
        href: route('community.index'),
    },
];

export default function Feed() {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />
        </AppLayoutTemplate>
    );
}
