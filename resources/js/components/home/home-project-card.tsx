import { useInitials } from '@/hooks/use-initials';
import { formatDate } from '@/lib/utils';
import { User } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function HomeProjectCard({ project }: { project: Project }) {
    const getInitials = useInitials();

    return (
        <li key={project.id} className="mb-2">
            <Link
                href={route('traceboard', { project: project.id })}
                className="flex w-full items-center gap-2 rounded-md border border-[#e3e3e0] bg-white p-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
            >
                <img src={'/lorenzo.png'} alt={project.title} className="h-14 w-14 rounded-md" />
                <div className="mt-1.5 w-full">
                    <h3 className="text-base leading-none font-semibold">{project.title}</h3>
                    <div className="flex w-full items-center justify-between leading-none text-muted-foreground">
                        <span> {formatDate(project.created_at)}</span>
                        <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                            {project.members &&
                                project.members.map((member: User) => (
                                    <Avatar key={member.id}>
                                        <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                        </div>
                    </div>
                </div>
            </Link>
        </li>
    );
}
