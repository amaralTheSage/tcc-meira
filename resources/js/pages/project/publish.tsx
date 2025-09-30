import ConfirmationDialog from '@/components/publish/confirmation-dialog';
import ImageSelector from '@/components/publish/image-selector';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { BreadcrumbItem, User } from '@/types';
import { Project } from '@/types/models';
import { Head, Link, useForm } from '@inertiajs/react';
import { ReactNode } from 'react';
import { toast, Toaster } from 'sonner';

export default function Publish({ project }: { project: Project }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: `Project ${project.title}`,
            href: route('project.publish', { project: project.id }),
        },

        {
            title: 'Publish',
            href: route('project.publishing_form', { project: project.id }),
        },
    ];

    const getInitials = useInitials();

    const { data, setData, post } = useForm({ title: project.title, description: '', images: [] });

    console.log(data);

    function submit(e) {
        e.preventDefault();

        console.log('ativado');
        post(route('project.publish', { project: project.id }), {
            preserveScroll: true,
            onError: (errors) => {
                toast.error('An error occurred when creating the project.');
                console.error(errors);
            },
        });
    }

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <div className="mx-auto w-full px-4 md:max-w-5xl">
                <div className="mt-24 mb-8 space-y-4">
                    <h2 className="font-cardo text-4xl font-medium tracking-tight">Publish Project</h2>
                    <nav className="space-x-4">
                        <span className="font-cardo text-2xl text-muted-foreground italic">{project.title}</span>
                    </nav>
                </div>

                <form onSubmit={submit} id="publish-form" className="grid w-full grid-cols-2 gap-4 gap-y-10">
                    <Label htmlFor={'title'} className="text-lg">
                        Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id={'title'}
                        placeholder="Title"
                        type="text"
                        value={project.title}
                        required
                        onChange={(e) => {
                            setData('title', e.target.value);
                        }}
                    />

                    {/* IMAGE SELECTOR */}
                    <div>
                        <Label htmlFor={'images-input'} className="text-lg">
                            Images <span className="text-destructive">*</span>
                        </Label>
                    </div>
                    <ImageSelector setData={setData} />

                    {/* ------------------------------ */}

                    <Label htmlFor={'description'} className="text-lg">
                        About <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id={'description'}
                        placeholder="Tell people about the project! What was the process like?"
                        required
                        className="min-h-46"
                        onChange={(e) => {
                            setData('description', e.target.value);
                        }}
                    />

                    <Label htmlFor={'members'} className="text-lg">
                        Members
                    </Label>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                            {project.members.map((member: User) => (
                                <div className="flex w-fit">
                                    <Avatar key={member.id}>
                                        <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            ))}
                        </div>
                        <span className="max-w-[175px] max-md:hidden">
                            {project.members[0].name.split(' ')[0]}{' '}
                            {project.members.length > 1 && (
                                <MembersHoverCard members={project.members}>and {project.members.length - 1} others</MembersHoverCard>
                            )}
                        </span>
                    </div>

                    <ConfirmationDialog>
                        <Button type="submit" form="publish-form">
                            Confirm
                        </Button>
                    </ConfirmationDialog>
                </form>
            </div>

            <Toaster />
        </AppLayoutTemplate>
    );
}

function MembersHoverCard({ children, members }: { children: ReactNode; members: User[] }) {
    return (
        <HoverCard>
            <HoverCardTrigger className="cursor-pointer underline">{children}</HoverCardTrigger>
            <HoverCardContent>
                <ul className="flex flex-col gap-2">
                    {members.map((member, index) => {
                        return (
                            index > 0 && (
                                <li className="cursor-pointer">
                                    <Link href={route('community.profile', { user: member.id })}></Link>
                                    {member.name}
                                </li>
                            )
                        );
                    })}
                </ul>
            </HoverCardContent>
        </HoverCard>
    );
}
