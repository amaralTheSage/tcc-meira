import { SprintBadge } from '@/components/sprint-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Column, ColumnTask, Project } from '@/types/models';
import { Head } from '@inertiajs/react';
import SharedProjectLayout from './layout';

export default function SharedKanban({ project, columns }: { project: Project; columns: Column[] }) {
    return (
        <SharedProjectLayout active="kanban" project={project}>
            <Head title={`${project.title} Kanban`} />
            <main className="custom-scrollbar flex min-h-[calc(100vh-13rem)] gap-4 overflow-x-auto p-6">
                {columns.map((column) => (
                    <ReadOnlyColumn key={column.id} column={column} project={project} />
                ))}
            </main>
        </SharedProjectLayout>
    );
}

function ReadOnlyColumn({ column, project }: { column: Column; project: Project }) {
    return (
        <section className="flex h-[34rem] w-80 shrink-0 flex-col rounded-md bg-neutral-900 p-3">
            <h2 className="border-b border-neutral-800 pb-3 text-sm font-semibold text-muted-foreground">{column.name ?? 'Untitled Column'}</h2>
            <div className="custom-scrollbar mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
                {(column.tasks ?? []).map((task) => (
                    <ReadOnlyTask key={task.id} project={project} task={task} />
                ))}
            </div>
        </section>
    );
}

function ReadOnlyTask({ project, task }: { project: Project; task: ColumnTask }) {
    const getInitials = useInitials();
    const sprint = project.sprints?.find((projectSprint) => String(projectSprint.id) === String(task.sprint_id));

    return (
        <article className="rounded-md bg-black p-3">
            {task.image && <img src={task.image} alt={task.title ?? 'Task image'} className="mb-3 max-h-44 w-full rounded-sm object-cover" />}
            {sprint && <SprintBadge className="mb-2 max-w-full" sprint={sprint} />}
            <h3 className="text-sm font-medium">{task.title ?? 'Untitled Task'}</h3>
            {task.description && <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{task.description}</p>}
            <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                    {task.users?.slice(0, 4).map((user) => (
                        <Avatar key={user.id} className="h-7 w-7">
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">{task.subtasks?.length ?? 0} subtasks</span>
            </div>
        </article>
    );
}
