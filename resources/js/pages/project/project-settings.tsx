import { Head, useForm, usePage } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

import MemberList from '@/components/member-list';
import EdgeCustomization from '@/components/project-settings/edge-customization';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { Project } from '@/types/models';
import { useState } from 'react';

export default function ProjectSettings({ project }: { project: Project }) {
    const { patch, setData, data } = useForm({
        edge_type: project.edge_type,
        animated_edges: project.animated_edges,
    });

    const project_id = usePage().url.split('/')[1];

    const [members, setMembers] = useState<number[]>(project.members.map((m) => m.id));

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Project Settings',
            href: route('project-settings', { project: project.id }),
        },
    ];

    function handleEdgeChange(type: string, animated: boolean) {
        setData('edge_type', type);
        setData('animated_edges', animated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        patch(route('projects.update', { project: project_id }), {
            preserveScroll: true,
            onSuccess: () => toast.success('Project settings updated successfully.'),
            onError: (errors) => {
                toast.error('Error updating settings.');
                console.error(errors);
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

                <section className="space-y-6">
                    <EdgeCustomization initialType={project.edge_type} initialAnimated={project.animated_edges} onChange={handleEdgeChange} />

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="col-span-2">
                            <Label htmlFor="members">Members</Label>
                        </div>

                        <div></div>

                        <div className="col-span-2">
                            <MemberList users={project.members} setSelectedUsers={setMembers} />
                        </div>
                    </div>
                </section>
            </form>
        </AppLayout>
    );
}
