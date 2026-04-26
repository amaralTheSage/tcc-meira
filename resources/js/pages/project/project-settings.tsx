import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Settings, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';

import MemberList from '@/components/member-list';
import ConfirmDeletionDialog from '@/components/project-settings/confirm-deletion-dialog';
import EdgeCustomization from '@/components/project-settings/edge-customization';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { EdgeTypeName, Project } from '@/types/models';
import { useCallback, useState } from 'react';

export default function ProjectSettings({ project }: { project: Project }) {
    const { patch, setData } = useForm({
        edge_type: project.edge_type,
        animated_edges: project.animated_edges,
    });

    const project_id = usePage().url.split('/')[1];

    const [, setMembers] = useState<number[]>(project.members.map((m) => m.id));

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Project Settings',
            href: route('project-settings', { project: project.id }),
        },
    ];

    const handleEdgeChange = useCallback(
        (type: EdgeTypeName, animated: boolean) => {
            setData('edge_type', type);
            setData('animated_edges', animated);
        },
        [setData],
    );

    function submit(e: React.FormEvent) {
        e.preventDefault();

        patch(route('projects.update', { project: project_id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Project settings updated successfully.'),
            onError: () => {
                toast.error('Error updating settings.');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={project}>
            <Head title="Project Settings" />
            <form onSubmit={submit} className="mx-auto w-full p-6 md:max-w-5xl">
                <div className="my-3 flex justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl">
                            <Settings className="h-6 w-6" />
                            Project Settings
                        </h1>
                        <p className="hidden text-muted-foreground sm:block">Customize your project according to your needs</p>
                    </div>
                    <Button className="px-6 font-bold" type="submit">
                        Save
                    </Button>
                </div>

                <section className="space-y-10">
                    <EdgeCustomization initialType={project.edge_type} initialAnimated={project.animated_edges} onChange={handleEdgeChange} />

                    <Separator />

                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">General Settings</h2>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="col-span-2">
                            <Label htmlFor="members">Members</Label>
                        </div>

                        <div></div>

                        <div className="col-span-2">
                            <MemberList users={project.members} setSelectedUsers={setMembers} />
                        </div>
                    </div>

                    <Separator />

                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-yellow-400">
                        Danger Zone <TriangleAlert size={22} />
                    </h2>
                    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-5">
                        <div className="col-span-2">
                            <Label htmlFor="members">Publishing</Label>
                            <p className="text-xs text-muted-foreground">
                                You can publish your project as a Community Post. The project will become inaccessible, and you'll be able to create a
                                new project in its place.
                            </p>
                        </div>

                        <div></div>

                        <div className="col-span-2 flex justify-end">
                            <Link href={`/${project.id}/publish`}>
                                <Button className="bg-red-700 px-6 py-5 font-extrabold uppercase" type="submit">
                                    Publish
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-5">
                        <div className="col-span-2">
                            <Label htmlFor="members">Delete Project</Label>
                            <p className="text-xs text-muted-foreground">Deletes the project without making a post.</p>
                        </div>

                        <div></div>

                        <div className="col-span-2 flex justify-end">
                            <ConfirmDeletionDialog id={project.id} />
                        </div>
                    </div>
                </section>
            </form>
        </AppLayout>
    );
}
