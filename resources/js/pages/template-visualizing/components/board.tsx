import Note from '@/components/traceboard/note';
import Task from '@/components/traceboard/task';
import { Project, TraceboardNote, TraceboardTask } from '@/types/models';
import { Background, Edge, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface BoardProps {
    tasks?: TraceboardTask[];
    project: Project;
    initialConnections: Edge[];
    initialNotes?: TraceboardNote[];
}

export default function Board({ tasks = [], project, initialConnections, initialNotes }: BoardProps) {
    function formatTasks(tasks: TraceboardTask[]): Node[] {
        return tasks.map((task) => ({
            id: task.id,
            type: 'Task',
            data: {
                members: project.members,
                title: task.title,
                image: task.image || null,
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
            },
            measured: { width: 1, height: 1 },
            position: { x: note.x, y: note.y },
        }));
    }

    const [nodes, setNodes, onNodesChange] = useNodesState([...formatTasks(tasks), ...formatNotes(initialNotes)]);

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialConnections);

    return (
        <main className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                proOptions={{ hideAttribution: true }}
                onEdgesChange={onEdgesChange}
                fitView
                nodeTypes={{ Task, Note }}
            >
                <Background />
            </ReactFlow>
        </main>
    );
}
