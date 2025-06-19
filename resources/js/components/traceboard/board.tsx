import { Project, TraceboardTask } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { addEdge, Background, Connection, Controls, Edge, Node, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import TaskPanel from './panel';
import Task from './task';

const initialEdges: Edge[] = [];

export default function Board({ tasks = [], project }: { tasks?: TraceboardTask[]; project: Project }) {
    function formatTasks(tasks: TraceboardTask[]): Node[] {
        const formatedTasks: Node[] = [];

        tasks.forEach((task) => {
            formatedTasks.push({
                id: task.id,
                type: 'Task',
                data: {
                    title: task.title,
                    image: task.image || null,
                    queueOperation: queueOperation,
                    removePendingOpsForTask: removePendingOpsForTask,
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

    const [nodes, setNodes, onNodesChange] = useNodesState(formatTasks(tasks));
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    console.log(tasks);

    // Pushes the function to each task, so they can use on updates
    nodes.forEach((n) => {
        if (!n.data.formatTasks) {
            n.data.formatTasks = formatTasks;
        }
    });

    const { flash } = usePage().props;

    // ----------------------------------------------------------------------------------------------------------
    const [pendingOps, setPendingOps] = useState<any[]>([]);
    const opsRef = useRef<any[]>(pendingOps);

    const syncOps = useRef(
        debounce(() => {
            if (opsRef.current.length > 0) {
                // Send opsRef.current to backend (e.g., via fetch or Inertia)
                opsRef.current.forEach((op) => {
                    if (op.type.toLowerCase() === 'create') {
                        router.post(
                            route('tasks.store', { project: project.id }),
                            { id: op.task.id, x: op.task.x, y: op.task.y },
                            { preserveScroll: true, onSuccess: () => {}, onError: () => {} },
                        );
                    } else if (op.type.toLowerCase() === 'update') {
                        router.patch(
                            route('tasks.update', { project: project.id, task: op.task.id }),
                            { title: op.task.title },
                            { preserveScroll: true, onSuccess: () => {}, onError: () => {} },
                        );
                    } else if (op.type.toLowerCase() === 'delete') {
                        router.delete(route('tasks.destroy', { project: project.id, task_id: op.task.id }), {
                            preserveScroll: true,
                            onSuccess: () => {},
                            onError: () => {},
                        });
                    }
                });

                // After success:
                setPendingOps([]);
            }
        }, 4000),
    ).current;

    useEffect(() => {
        opsRef.current = pendingOps;
    }, [pendingOps]);

    function queueOperation(op: { type: string; task: { id?: string; title?: string; image?: string; x?: number; y?: number } }) {
        setPendingOps((ops) => [...ops, op]);
        syncOps();
    }

    function removePendingOpsForTask(taskId: string) {
        setPendingOps((ops) => ops.filter((op) => op.task.id !== taskId));
    }

    function createTask(screenToFlowPosition) {
        const taskId = `${project.id}_${crypto.randomUUID()}`;

        const flowPosition = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        setNodes((prevNodes) => [
            ...prevNodes,
            {
                id: taskId,
                data: {
                    queueOperation: queueOperation,
                    formatTasks: formatTasks,
                    removePendingOpsForTask: removePendingOpsForTask,
                },
                type: 'Task',
                position: {
                    x: Math.trunc(flowPosition.x),
                    y: Math.trunc(flowPosition.y),
                },
            },
        ]);

        queueOperation({
            type: 'create',
            task: {
                id: taskId,
                x: Math.trunc(flowPosition.x),
                y: Math.trunc(flowPosition.y),
            },
        });
    }

    useEffect(() => {
        console.log('pending operations: ', pendingOps);
    }, [pendingOps]);
    // ----------------------------------------------------------------------------------------------------------

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
                nodeTypes={{
                    Task: Task,
                }}
            >
                <Background />
                <Controls />
                <TaskPanel createTask={createTask} />
            </ReactFlow>
        </main>
    );
}
