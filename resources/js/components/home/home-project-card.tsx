import { useInitials } from '@/hooks/use-initials';
import { formatDate } from '@/lib/utils';
import { User } from '@/types';
import { Project } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function HomeProjectCard({ project }: { project: Project }) {
    const getInitials = useInitials();

    return (
        <li key={project.id} className="mb-1">
            <Link
                data-testid={`home-project-card-${project.id}`}
                href={route('traceboard', { project: project.id })}
                className="flex w-full items-center gap-2 rounded-md border border-border/70 bg-sidebar/60 p-2 text-sm leading-normal text-foreground transition-colors hover:border-red-900/60 hover:bg-muted/40"
            >
                <div className="mt-1.5 w-full px-2">
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
