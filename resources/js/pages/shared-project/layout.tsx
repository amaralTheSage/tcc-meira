import { Button } from '@/components/ui/button';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { BreadcrumbItem } from '@/types';
import { Project } from '@/types/models';
import { Link, useForm } from '@inertiajs/react';
import { BookOpenText, Copy, Download, GitFork, LayoutDashboard, Pin, SquareKanban } from 'lucide-react';
import { ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

interface SharedProjectLayoutProps {
    active: 'traceboard' | 'kanban' | 'pins' | 'docs';
    children: ReactNode;
    project: Project;
}

interface SharedNavItem {
    href: string;
    icon: typeof LayoutDashboard;
    key: SharedProjectLayoutProps['active'];
    label: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Shared Project',
        href: '#',
    },
];

export default function SharedProjectLayout({ active, children, project }: SharedProjectLayoutProps) {
    const form = useForm();
    const shareToken = project.share_token ?? '';
    const navItems = sharedNavItems(shareToken);

    function copyLink(): void {
        void navigator.clipboard.writeText(project.share_url ?? window.location.href);
        toast.success('Share link copied.');
    }

    function copyProject(): void {
        form.post(route('shared.copy', shareToken));
    }

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <header className="border-b border-border/70 bg-background px-4 py-5">
                <div className="mx-auto flex w-full flex-col gap-4 md:max-w-7xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">{project.visibility}</p>
                            <h1 className="font-cardo text-4xl font-medium">{project.publication?.title ?? project.title}</h1>
                            <p className="mt-1 text-sm text-muted-foreground">{project.public_views_count ?? 0} unique views</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={copyLink}>
                                <Copy className="h-4 w-4" />
                                Copy Link
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={route('shared.export', shareToken)}>
                                    <Download className="h-4 w-4" />
                                    Export JSON
                                </a>
                            </Button>
                            <Button onClick={copyProject} disabled={form.processing}>
                                <GitFork className="h-4 w-4" />
                                Use as Base
                            </Button>
                        </div>
                    </div>

                    <nav className="flex flex-wrap gap-2">
                        {navItems.map((item) => (
                            <Button key={item.key} variant={active === item.key ? 'secondary' : 'ghost'} asChild>
                                <Link href={item.href}>
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </div>
            </header>
            {children}
            <Toaster />
        </AppLayoutTemplate>
    );
}

function sharedNavItems(shareToken: string): SharedNavItem[] {
    return [
        { href: route('shared.traceboard', shareToken), icon: LayoutDashboard, key: 'traceboard' as const, label: 'Traceboard' },
        { href: route('shared.kanban', shareToken), icon: SquareKanban, key: 'kanban' as const, label: 'Kanban' },
        { href: route('shared.pins', shareToken), icon: Pin, key: 'pins' as const, label: 'Pins' },
        { href: route('shared.docs', shareToken), icon: BookOpenText, key: 'docs' as const, label: 'Docs' },
    ];
}
