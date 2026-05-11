import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem } from '@/types';
import type { Column, ColumnTask, Project, TaskStatus, Template, TemplateTask } from '@/types/models';
import { Head } from '@inertiajs/react';
import { SquareKanban } from 'lucide-react';
import AppLayout from './visualizing-layout/app-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kanban',
        href: '#',
    },
];

export default function Kanban({ template }: { template: Template }) {
    const previewProject = templatePreviewProject(template);
    const columns = templateKanbanColumns(template.data.columns, template.data.tasks);

    return (
        <AppLayout breadcrumbs={breadcrumbs} project={previewProject}>
            <Head title="Kanban" />
            <main className="flex h-full min-h-[calc(100vh-8.5rem)] flex-col">
                <TemplateKanbanHeader template={template} columns={columns} />
                <div data-testid="template-kanban-board" className="custom-scrollbar flex flex-1 gap-4 overflow-x-auto p-6">
                    {columns.map((column) => (
                        <TemplateKanbanColumn key={column.id} column={column} />
                    ))}
                </div>
            </main>
        </AppLayout>
    );
}

function TemplateKanbanHeader({ template, columns }: { template: Template; columns: Column[] }) {
    const taskCount = columns.reduce((count, column) => count + (column.tasks?.length ?? 0), 0);

    return (
        <header className="flex items-center justify-between border-b border-border/70 px-6 py-4">
            <div className="min-w-0">
                <h1 className="flex items-center gap-2 truncate text-2xl font-semibold">
                    <SquareKanban className="h-6 w-6 shrink-0 text-red-500" />
                    {template.name}
                </h1>
            </div>
            <p className="shrink-0 text-sm text-muted-foreground">
                {columns.length} columns / {taskCount} tasks
            </p>
        </header>
    );
}

function TemplateKanbanColumn({ column }: { column: Column }) {
    return (
        <section
            data-testid={`template-kanban-column-${column.id}`}
            className="flex h-[34rem] w-80 shrink-0 flex-col rounded-md border border-border/70 bg-sidebar/60 p-3 shadow-sm shadow-black/20"
        >
            <h2 className="border-b border-border/70 pb-3 text-sm font-semibold text-foreground">{column.name ?? 'Untitled Column'}</h2>
            <div className="custom-scrollbar mt-3 flex flex-1 flex-col gap-2 overflow-y-auto">
                {(column.tasks ?? []).length > 0 ? (
                    column.tasks?.map((task) => <TemplateKanbanTaskCard key={task.id} task={task} />)
                ) : (
                    <p className="rounded-md border border-dashed border-border/70 p-3 text-sm text-muted-foreground">No tasks</p>
                )}
            </div>
        </section>
    );
}

function TemplateKanbanTaskCard({ task }: { task: ColumnTask }) {
    return (
        <article
            data-testid={`template-kanban-task-${task.id}`}
            className="rounded-md border border-border/70 bg-background/90 p-3 shadow-sm shadow-black/20"
        >
            {task.image && <img src={task.image} alt={task.title ?? 'Task image'} className="mb-3 max-h-44 w-full rounded-sm object-cover" />}
            <h3 className="text-sm font-medium">{task.title ?? 'Untitled Task'}</h3>
            <TemplateTaskDescription task={task} />
            <div className="mt-3 flex items-center justify-between gap-3">
                <TemplateTaskAssignees task={task} />
                <span className="shrink-0 text-xs text-muted-foreground">{task.subtasks?.length ?? 0} subtasks</span>
            </div>
        </article>
    );
}

function TemplateTaskDescription({ task }: { task: ColumnTask }) {
    if (!task.description) {
        return null;
    }

    return <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">{task.description}</p>;
}

function TemplateTaskAssignees({ task }: { task: ColumnTask }) {
    const getInitials = useInitials();

    return (
        <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
            {task.users?.slice(0, 4).map((user) => (
                <Avatar key={user.id} className="h-7 w-7">
                    <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
            ))}
        </div>
    );
}

function templatePreviewProject(template: Template): Project {
    return {
        id: template.id,
        title: template.name,
        members: [],
        edge_type: 'bezier',
        animated_edges: true,
    };
}

function templateKanbanColumns(sourceColumns: Column[], sourceTasks: TemplateTask[]): Column[] {
    const orderedColumns = sortedTemplateColumns(sourceColumns);
    const fallbackColumnId = templateFallbackColumnId(orderedColumns);
    const columnIds = new Set(orderedColumns.map((column) => String(column.id)));

    return orderedColumns.map((column) => ({
        ...column,
        tasks: templateColumnTasks(column, sourceTasks, columnIds, fallbackColumnId),
    }));
}

function sortedTemplateColumns(sourceColumns: Column[]): Column[] {
    const columns = sourceColumns.length > 0 ? sourceColumns : [emptyTemplateColumn()];

    return [...columns].sort((firstColumn, secondColumn) => firstColumn.position - secondColumn.position);
}

function templateColumnTasks(column: Column, sourceTasks: TemplateTask[], columnIds: Set<string>, fallbackColumnId: string): ColumnTask[] {
    return [...sourceTasks]
        .sort((firstTask, secondTask) => (firstTask.position ?? 0) - (secondTask.position ?? 0))
        .filter((task) => resolvedTemplateTaskColumnId(task, columnIds, fallbackColumnId) === String(column.id))
        .map(templateColumnTask);
}

function resolvedTemplateTaskColumnId(task: TemplateTask, columnIds: Set<string>, fallbackColumnId: string): string {
    const requestedColumnId = task.column_id === undefined || task.column_id === null ? null : String(task.column_id);

    if (requestedColumnId !== null && columnIds.has(requestedColumnId)) {
        return requestedColumnId;
    }

    return fallbackColumnId;
}

function templateColumnTask(task: TemplateTask): ColumnTask {
    return {
        id: task.id,
        title: task.title ?? undefined,
        description: task.description ?? undefined,
        image: task.image ?? undefined,
        position: task.position ?? 0,
        project_id: task.project_id,
        status: templateTaskStatus(task.status),
        sprint_id: task.sprint_id === undefined || task.sprint_id === null ? undefined : String(task.sprint_id),
        subtasks: task.subtasks ?? [],
        tags: task.tags ?? [],
        users: task.users ?? [],
        created_at: task.created_at ?? '',
    };
}

function templateTaskStatus(status: TemplateTask['status']): TaskStatus | undefined {
    if (status === 'pending' || status === 'in_progress' || status === 'completed') {
        return status;
    }

    return undefined;
}

function templateFallbackColumnId(columns: Column[]): string {
    return String(columns.find((column) => column.type === 'backlog')?.id ?? columns[0].id);
}

function emptyTemplateColumn(): Column {
    return {
        id: 'template-backlog',
        name: 'Backlog',
        position: 0,
        tasks: [],
        type: 'backlog',
    };
}
