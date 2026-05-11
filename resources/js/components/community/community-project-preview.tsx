import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { CommunityPostPreview, CommunityPostPreviewNote, CommunityPostPreviewTask } from '@/types/models';
import { Background, Edge, Handle, Node, NodeProps, NodeTypes, Position, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CalendarDays, Workflow } from 'lucide-react';
import { useMemo } from 'react';

interface CommunityProjectPreviewProps {
    className?: string;
    members?: User[];
    preview?: CommunityPostPreview;
}

interface CommunityTaskNodeData extends Record<string, unknown> {
    members: User[];
    task: CommunityPostPreviewTask;
}

interface CommunityNoteNodeData extends Record<string, unknown> {
    note: CommunityPostPreviewNote;
}

type CommunityTaskNodeProps = Node<CommunityTaskNodeData, 'CommunityTask'>;
type CommunityNoteNodeProps = Node<CommunityNoteNodeData, 'CommunityNote'>;

const previewNodeTypes = {
    CommunityTask: CommunityTaskNode,
    CommunityNote: CommunityNoteNode,
} as NodeTypes;

const previewFitViewOptions = { padding: 0.35, minZoom: 0.16, maxZoom: 0.85 };

export default function CommunityProjectPreview({ className, members = [], preview }: CommunityProjectPreviewProps) {
    const nodes = useMemo(() => previewNodes(preview, members), [members, preview]);
    const edges = useMemo(() => previewEdges(preview), [preview]);

    return (
        <div className={cn('relative h-full min-h-48 w-full overflow-hidden bg-black text-white', className)} data-testid="community-project-preview">
            {nodes.length === 0 ? <EmptyWorkflowPreview /> : <WorkflowPreviewCanvas edges={edges} nodes={nodes} />}
        </div>
    );
}

function WorkflowPreviewCanvas({ edges, nodes }: { edges: Edge[]; nodes: Node[] }) {
    return (
        <ReactFlow
            className="pointer-events-none"
            nodes={nodes}
            edges={edges}
            fitView
            fitViewOptions={previewFitViewOptions}
            nodeTypes={previewNodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            nodesFocusable={false}
            edgesFocusable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
        >
            <Background />
        </ReactFlow>
    );
}

function CommunityTaskNode({ data: { members, task } }: NodeProps<CommunityTaskNodeProps>) {
    const getInitials = useInitials();
    const total = task.subtasks_total > 0 ? task.subtasks_total : 5;
    const completed = task.subtasks_total > 0 ? task.subtasks_completed : task.status === 'completed' ? total : 3;
    const progress = task.status === 'completed' ? 100 : Math.round((completed / total) * 100);

    return (
        <div
            className={cn(
                'relative w-sm rounded-md border border-border bg-card p-3 text-[#EDEDEC]',
                task.status === 'completed' && 'border-green-500',
            )}
        >
            <PreviewHandle position={Position.Left} type="target" />
            {task.image && <img src={task.image} alt="" className="mb-2 aspect-video w-full rounded-md object-cover object-center" />}
            <div className="mb-2 flex items-start justify-between gap-2">{task.sprint && <PreviewSprintBadge task={task} />}</div>
            <p className="ml-2 w-full text-base font-medium break-all">{task.title || 'Untitled task'}</p>
            <div className="flex flex-row flex-wrap items-center justify-between gap-2 py-2">
                <MemberAvatars getInitials={getInitials} members={members} />
                <span className="flex h-fit w-fit items-center gap-1 p-2 text-sm font-semibold text-white/90">
                    <Workflow className="h-4.5! w-4.5!" />
                    {completed}/{total}
                </span>
            </div>
            <div className="h-1 rounded-md bg-green-600" style={{ width: `${progress}%` }} />
            <PreviewHandle position={Position.Right} type="source" />
        </div>
    );
}

function PreviewSprintBadge({ task }: { task: CommunityPostPreviewTask }) {
    if (!task.sprint) {
        return null;
    }

    return (
        <span
            className="inline-flex max-w-44 min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-none text-foreground/90 shadow-sm backdrop-blur-sm"
            style={{ backgroundColor: `${task.sprint.color}22`, borderColor: task.sprint.color }}
        >
            <CalendarDays aria-hidden="true" className="size-3 shrink-0 opacity-80" style={{ color: task.sprint.color }} />
            <span className="truncate font-medium">{task.sprint.title}</span>
        </span>
    );
}

function MemberAvatars({ getInitials, members }: { getInitials: (name: string) => string; members: User[] }) {
    return (
        <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
            {members.map((member) => (
                <Avatar key={member.id}>
                    <AvatarImage src={member.avatar ?? undefined} alt={member.name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-neutral-700 text-white">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
            ))}
        </div>
    );
}

function PreviewHandle({ position, type }: { position: Position; type: 'source' | 'target' }) {
    return (
        <Handle type={type} position={position} style={{ background: 'none', border: 'none' }}>
            <div className="size-20">
                <div className="relative right-1 bottom-1 size-3 rounded-full border-2 border-white bg-gray-900" />
            </div>
        </Handle>
    );
}

function CommunityNoteNode({ data: { note } }: NodeProps<CommunityNoteNodeProps>) {
    return (
        <div className="relative max-w-[400px] min-w-[200px] -rotate-1 transform rounded-sm bg-yellow-200 p-3 pt-1.5 text-black shadow-sm">
            <p className="mt-[13px] text-sm leading-relaxed">{note.text || '...'}</p>
        </div>
    );
}

function EmptyWorkflowPreview() {
    return (
        <div className="flex h-full min-h-48 items-center justify-center">
            <div className="rounded-md border border-white/15 bg-neutral-950/80 px-5 py-3 text-sm text-white/70">Published workflow preview</div>
        </div>
    );
}

function previewNodes(preview: CommunityPostPreview | undefined, members: User[]): Node[] {
    if (!preview) {
        return [];
    }

    return [...preview.tasks.map((task) => taskNode(task, members)), ...preview.notes.map(noteNode)];
}

function taskNode(task: CommunityPostPreviewTask, members: User[]): Node<CommunityTaskNodeData, 'CommunityTask'> {
    return {
        id: task.id,
        type: 'CommunityTask',
        data: { members, task },
        measured: { width: 1, height: 1 },
        position: { x: task.x ?? 0, y: task.y ?? 0 },
    };
}

function noteNode(note: CommunityPostPreviewNote): Node<CommunityNoteNodeData, 'CommunityNote'> {
    return {
        id: note.id,
        type: 'CommunityNote',
        data: { note },
        measured: { width: 1, height: 1 },
        position: { x: note.x ?? 0, y: note.y ?? 0 },
    };
}

function previewEdges(preview: CommunityPostPreview | undefined): Edge[] {
    if (!preview) {
        return [];
    }

    const taskIds = new Set(preview.tasks.map((task) => task.id));

    return preview.tasks.flatMap((task) =>
        task.target_ids
            .filter((targetId) => taskIds.has(targetId))
            .map((targetId) => ({
                id: `${task.id}-${targetId}`,
                source: task.id,
                target: targetId,
                type: preview.edge_type,
                animated: false,
            })),
    );
}
