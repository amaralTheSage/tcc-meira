import HeadingSmall from '@/components/heading-small';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import SettingsLayout from '@/layouts/settings/layout';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];

export default function Appearance() {
    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Appearance settings" description="Dark mode is currently locked for this workspace." />
                </div>
            </SettingsLayout>
            <Toaster />
        </AppLayoutTemplate>
    );
}
