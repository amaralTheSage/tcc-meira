import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { Column, Project } from '@/types/models';
import { SquareKanban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import KanbanFilter from './kanban-filter';

export default function KanbanHeader({
    columns,
    filters,
    setFilters,
    project,
}: {
    columns: Column[];
    filters: { member: string; tag: string; date: string; sprint: string };
    setFilters: React.Dispatch<React.SetStateAction<{ member: string; tag: string; date: string; sprint: string }>>;
    project: Project;
}) {
    const getInitials = useInitials();

    return (
        <div className="flex w-full flex-col gap-4 border-b border-border/70 bg-background/95 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-red-900/40 bg-red-950/30 text-red-200">
                    <SquareKanban className="size-4" />
                </div>
                <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold text-foreground">{project.title}</h1>
                </div>
                <div className="flex">
                    <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                        {project.members.map((member: User) => (
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

            <KanbanFilter columns={columns} filters={filters} setFilters={setFilters} project={project} />
        </div>
    );
}
