import { TraceboardTask } from '@/types/models';
import { addEdge, Background, Connection, Controls, Edge, Node, Panel, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SquarePlus } from 'lucide-react';
import { useCallback } from 'react';
import Task from './task';

function formatTasks(tasks: TraceboardTask[]): Node[] {
    const formatedTasks: Node[] = [];

    tasks.forEach((task) => {
        formatedTasks.push({
            id: task.id,
            type: 'Task',
            data: {
                title: task.title,
                image: task.image || null,
            },
            measured: { width: 1, height: 1 },
            position: {
                x: task.x,
                y: task.y,
            },
        });
    });

    return formatedTasks;
}

const initialEdges: Edge[] = [];

const nodeTypes = {
    Task: Task,
};

export function createTask(setNodes) {
    setNodes((prevNodes) => [
        ...prevNodes,
        {
            id: `${prevNodes.length + 1}`,
            data: {},
            type: 'Task',
            position: {
                x: 200,
                y: 200,
            },
        },
    ]);
}

export default function Board({ tasks }: { tasks: TraceboardTask[] }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(formatTasks(tasks));
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (connection: Connection) => {
            const edge = {
                ...connection,
                id: `${connection.source}-${connection.target}`,
                markerEnd: 'arrowClosed',
            };
            setEdges((prevEdges) => addEdge(edge, prevEdges));
        },
        [setEdges],
    );

    return (
        <main className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                nodeTypes={nodeTypes}
            >
                <Background />
                <Controls />
                <Panel position="center-left" className="rounded-md bg-white p-2">
                    <SquarePlus onClick={() => createTask(setNodes)} />
                </Panel>
            </ReactFlow>
        </main>
    );
}
