import Note from '@/components/traceboard/note';
import Task from '@/components/traceboard/task';
import { BoardOperation, Project, TraceboardNote, TraceboardTask } from '@/types/models';
import { Background, Edge, type Node, type NodeTypes, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface BoardProps {
    tasks?: TraceboardTask[];
    project: Project;
    initialConnections: Edge[];
    initialNotes?: TraceboardNote[];
}

const previewNodeTypes = { Task, Note } as NodeTypes;
const ignorePreviewOperation = (_operation: BoardOperation): void => undefined;
const ignorePreviewTask = (_taskId: string): void => undefined;

export default function Board({ tasks = [], project, initialConnections, initialNotes = [] }: BoardProps) {
    function formatTasks(tasks: TraceboardTask[]): Node[] {
        return tasks.map((task) => ({
            id: task.id,
            type: 'Task',
            data: {
                members: project.members,
                title: task.title,
                image: task.image || null,
                queueOperation: ignorePreviewOperation,
                removePendingOpsForTask: ignorePreviewTask,
                status: task.status,
            },
            measured: { width: 1, height: 1 },
            position: { x: task.x, y: task.y },
        }));
    }

    function formatNotes(notes: TraceboardNote[]): Node[] {
        return notes.map((note) => ({
            id: note.id,
            type: 'Note',
            data: {
                text: note.text,
                DeleteNote: ignorePreviewTask,
                UpdateNoteText: () => undefined,
            },
            measured: { width: 1, height: 1 },
            position: { x: note.x, y: note.y },
        }));
    }

    const [nodes, , onNodesChange] = useNodesState([...formatTasks(tasks), ...formatNotes(initialNotes)]);

    const [edges, , onEdgesChange] = useEdgesState(initialConnections);

    return (
        <main className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                proOptions={{ hideAttribution: true }}
                onEdgesChange={onEdgesChange}
                onNodesChange={onNodesChange}
                fitView
                nodeTypes={previewNodeTypes}
            >
                <Background />
            </ReactFlow>
        </main>
    );
}
