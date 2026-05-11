import { Button } from '@/components/ui/button';
import {
    GanttFeature,
    GanttFeatureList,
    GanttFeatureRow,
    GanttHeader,
    GanttProvider,
    GanttSidebar,
    GanttTimeline,
    GanttToday,
} from '@/components/ui/shadcn-io/gantt';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { normalizeSprintHexColor, sprintAccentStyle, sprintColorReadableText } from '@/lib/sprint-colors';
import { ColumnTask, Sprint } from '@/types/models';
import { Link } from '@inertiajs/react';
import { addDays, formatDistance, isSameDay } from 'date-fns';
import { CheckCircle2, GitBranch, ListChecks, Pencil, Play, Trash2 } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

interface SprintBoardProps {
    onComplete: (sprintId: string) => void;
    onDelete: (sprint: Sprint) => void;
    onEdit: (sprint: Sprint) => void;
    onSelectTasks: (sprintId: string) => void;
    onStart: (sprintId: string) => void;
    projectId: string;
    sprints: (Sprint & { tasks: ColumnTask[] })[];
}

interface SprintBoardActionsProps {
    onComplete: (sprintId: string) => void;
    onDelete: (sprint: Sprint) => void;
    onEdit: (sprint: Sprint) => void;
    onSelectTasks: (sprintId: string) => void;
    onStart: (sprintId: string) => void;
    projectId: string;
    sprint: Sprint;
}

type SprintSidebarRowProps = Omit<SprintBoardActionsProps, 'sprint'> & {
    sprint: Sprint & { tasks: ColumnTask[] };
};

interface SprintActionButtonProps {
    children: ReactNode;
    label: string;
    onClick: () => void;
    testId: string;
    tone?: 'default' | 'danger';
}

function SprintBoard({ projectId, sprints, onComplete, onDelete, onEdit, onSelectTasks, onStart }: SprintBoardProps) {
    return (
        <GanttProvider
            className="h-[85%] border"
            range="monthly" // This will likely become dynamic
            zoom={200} // This will likely become dynamic
        >
            <SprintSidebarRows
                projectId={projectId}
                sprints={sprints}
                onComplete={onComplete}
                onDelete={onDelete}
                onEdit={onEdit}
                onSelectTasks={onSelectTasks}
                onStart={onStart}
            />
            <GanttTimeline>
                <GanttHeader />
                <SprintTimelineRows sprints={sprints} />
                <GanttToday />
            </GanttTimeline>
        </GanttProvider>
    );
}

function SprintSidebarRows(props: SprintBoardProps): ReactElement {
    return (
        <GanttSidebar>
            {props.sprints.map((sprint) => (
                <SprintSidebarRow key={sprint.id} {...props} sprint={sprint} />
            ))}
        </GanttSidebar>
    );
}

function SprintTimelineRows({ sprints }: { sprints: (Sprint & { tasks: ColumnTask[] })[] }): ReactElement {
    return (
        <GanttFeatureList>
            {sprints.map((sprint) => (
                <GanttFeatureRow key={sprint.id} features={[createSprintGanttFeature(sprint)]} draggable={false}>
                    {(feature) => <SprintTimelineFeature feature={feature} />}
                </GanttFeatureRow>
            ))}
        </GanttFeatureList>
    );
}

function SprintSidebarRow(props: SprintSidebarRowProps): ReactElement {
    return (
        <div
            className="relative flex items-center gap-2.5 p-2.5 text-xs hover:bg-secondary"
            data-testid={`sprint-sidebar-row-${props.sprint.id}`}
            style={{ height: 'var(--gantt-row-height)' }}
        >
            <div className="h-2 w-2 shrink-0 rounded-full" style={sprintAccentStyle(props.sprint.color)} />
            <p className="min-w-0 flex-1 truncate text-left font-medium">{props.sprint.title}</p>
            <p className="shrink-0 text-muted-foreground">{formatSprintDuration(props.sprint)}</p>
            <SprintBoardActions {...props} />
        </div>
    );
}

export function createSprintGanttFeature(sprint: Sprint): GanttFeature {
    return {
        id: `sprint-${sprint.id}`,
        name: sprint.title,
        startAt: new Date(sprint.start_at),
        endAt: new Date(sprint.end_at),
        status: { id: sprint.id, name: sprint.title, color: normalizeSprintHexColor(sprint.color) },
    };
}

export function SprintTimelineFeature({ feature }: { feature: GanttFeature }): ReactElement {
    const sprintColor = normalizeSprintHexColor(feature.status.color);

    return (
        <div
            aria-label={`Sprint timeline item ${feature.name}`}
            className="flex h-full w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md border px-2 text-xs font-semibold shadow-sm select-none"
            style={{
                backgroundColor: sprintColor,
                borderColor: sprintColor,
                color: sprintColorReadableText(sprintColor),
            }}
        >
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current opacity-75" />
            <span className="truncate">{feature.name}</span>
        </div>
    );
}

export function SprintBoardActions({
    projectId,
    sprint,
    onComplete,
    onDelete,
    onEdit,
    onSelectTasks,
    onStart,
}: SprintBoardActionsProps): ReactElement {
    return (
        <div className="flex shrink-0 items-center gap-1">
            <SprintLifecycleAction sprint={sprint} onComplete={onComplete} onStart={onStart} />
            <SprintActionButton
                label={`Select tasks for ${sprint.title}`}
                testId={`sprint-select-tasks-${sprint.id}`}
                onClick={() => onSelectTasks(sprint.id)}
            >
                <ListChecks className="size-3.5" />
            </SprintActionButton>
            <SprintTraceboardLink projectId={projectId} sprint={sprint} />
            <SprintActionButton label={`Edit sprint ${sprint.title}`} testId={`sprint-edit-${sprint.id}`} onClick={() => onEdit(sprint)}>
                <Pencil className="size-3.5" />
            </SprintActionButton>
            <SprintActionButton
                label={`Delete sprint ${sprint.title}`}
                testId={`sprint-delete-${sprint.id}`}
                onClick={() => onDelete(sprint)}
                tone="danger"
            >
                <Trash2 className="size-3.5" />
            </SprintActionButton>
        </div>
    );
}

function formatSprintDuration(sprint: Sprint): string {
    const startAt = new Date(sprint.start_at);
    const endAt = new Date(sprint.end_at);
    const adjustedEndAt = isSameDay(startAt, endAt) ? addDays(endAt, 1) : endAt;

    return formatDistance(startAt, adjustedEndAt);
}

function SprintLifecycleAction({
    sprint,
    onComplete,
    onStart,
}: {
    onComplete: (sprintId: string) => void;
    onStart: (sprintId: string) => void;
    sprint: Sprint;
}): ReactElement {
    if (sprint.status === 'completed') {
        return <SprintDisabledAction label={`${sprint.title} is completed`} testId={`sprint-completed-${sprint.id}`} />;
    }

    if (sprint.status === 'active') {
        return (
            <SprintActionButton
                label={`Complete sprint ${sprint.title}`}
                testId={`sprint-complete-${sprint.id}`}
                onClick={() => onComplete(sprint.id)}
            >
                <CheckCircle2 className="size-3.5" />
            </SprintActionButton>
        );
    }

    return (
        <SprintActionButton label={`Start sprint ${sprint.title}`} testId={`sprint-start-${sprint.id}`} onClick={() => onStart(sprint.id)}>
            <Play className="size-3.5" />
        </SprintActionButton>
    );
}

function SprintDisabledAction({ label, testId }: { label: string; testId: string }): ReactElement {
    return (
        <Button data-testid={testId} type="button" size="icon-sm" variant="ghost" aria-label={label} disabled className="size-7 opacity-50">
            <CheckCircle2 className="size-3.5" />
        </Button>
    );
}

function SprintTraceboardLink({ projectId, sprint }: { projectId: string; sprint: Sprint }): ReactElement {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    asChild
                    data-testid={`sprint-traceboard-${sprint.id}`}
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Open traceboard for ${sprint.title}`}
                    className="size-7 text-muted-foreground hover:text-foreground"
                >
                    <Link href={createSprintTraceboardUrl(projectId, sprint.id)}>
                        <GitBranch className="size-3.5" />
                    </Link>
                </Button>
            </TooltipTrigger>
            <TooltipContent>Open traceboard</TooltipContent>
        </Tooltip>
    );
}

function SprintActionButton({ children, label, onClick, testId, tone = 'default' }: SprintActionButtonProps): ReactElement {
    const toneClass = tone === 'danger' ? 'hover:bg-destructive/10 hover:text-destructive' : 'hover:text-foreground';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    data-testid={testId}
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={label}
                    onClick={onClick}
                    className={`size-7 text-muted-foreground ${toneClass}`}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

export function createSprintTraceboardUrl(projectId: string, sprintId: string): string {
    const traceboardUrl = route('traceboard', { project: projectId });
    const separator = traceboardUrl.includes('?') ? '&' : '?';

    return `${traceboardUrl}${separator}sprint=${encodeURIComponent(sprintId)}`;
}

export default SprintBoard;
