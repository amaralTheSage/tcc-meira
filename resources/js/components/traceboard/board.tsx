import { Project, TraceboardTask } from '@/types/models';
import { router } from '@inertiajs/react';
import { addEdge, Background, Connection, Edge, Node, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Loader from '../loader';
import TaskPanel from './panel';
import Task from './task';

export default function Board({
    tasks = [],
    project,
    initialConnections,
}: {
    tasks?: TraceboardTask[];
    project: Project;
    initialConnections: Edge[];
}) {
    const debounceDelay = 5000;

    // ----------------------------------------------------------------------------------------------------------
    // TASK / NODE STATE + HELPERS
    // ----------------------------------------------------------------------------------------------------------

    const [nodes, setNodes, onNodesChange] = useNodesState(formatTasks(tasks));

    function formatTasks(tasks: TraceboardTask[]): Node[] {
        return tasks.map((task) => ({
            id: task.id,
            type: 'Task',
            data: {
                members: project.members,
                title: task.title,
                image: task.image || null,
                completed: false, // TEMP
                queueOperation,
                removePendingOpsForTask,
            },
            measured: { width: 1, height: 1 },
            position: { x: task.x, y: task.y },
        }));
    }

    function createTask(screenToFlowPosition) {
        const taskId = `${project.title
            .toLowerCase()
            .split(/[,;_ ]/)
            .join('-')}_${crypto.randomUUID()}`;

        const flowPosition = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        setNodes((prev) => [
            ...prev,
            {
                id: taskId,
                data: {
                    members: project.members,
                    queueOperation,
                    formatTasks,
                    removePendingOpsForTask,
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

    nodes.forEach((n) => {
        if (!n.data.formatTasks) {
            n.data.formatTasks = formatTasks;
        }
    });

    // ----------------------------------------------------------------------------------------------------------
    // EDGE STATE + HANDLERS
    // ----------------------------------------------------------------------------------------------------------

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialConnections);

    const onConnect = useCallback(
        (connection: Connection) => {
            const targetNode = nodes.find((node) => node.id === connection.target);
            const isTargetCompleted = targetNode?.data?.completed || false;

            const edge = {
                ...connection,
                id: `${connection.source}-${connection.target}`,
                animated: !isTargetCompleted,
            };

            setEdges((prev) => addEdge(edge, prev));
            queueOperation({
                type: 'connect',
                task: {},
                connection: { source_id: connection.source, target_id: connection.target },
            });
        },
        [nodes, setEdges],
    );

    function onEdgesDelete(edgesToDelete) {
        edgesToDelete.forEach((ed) => {
            queueOperation({
                type: 'disconnect',
                task: {},
                connection: { source_id: ed.source, target_id: ed.target },
            });
        });
    }

    function updateEdgeAnimations(edges: Edge[], nodes: Node[]): Edge[] {
        return edges.map((edge) => {
            const targetNode = nodes.find((node) => node.id === edge.target);
            return { ...edge, animated: !(targetNode?.data?.completed || false) };
        });
    }

    useEffect(() => {
        setEdges((current) => updateEdgeAnimations(current, nodes));
    }, [nodes, setEdges]);

    // ----------------------------------------------------------------------------------------------------------
    // PENDING OPERATIONS QUEUE + SYNC
    // ----------------------------------------------------------------------------------------------------------

    const [pendingOps, setPendingOps] = useState<any[]>([]);
    const opsRef = useRef<any[]>(pendingOps);
    const [isSyncingOps, setIsSyncingOps] = useState<boolean>(false);

    function queueOperation(op: {
        type: string;
        task?: { id?: string; title?: string; image?: string; x?: number; y?: number };
        connection?: { source_id: string; target_id: string };
    }) {
        setPendingOps((ops) => [...ops, op]);
        syncOps();
    }

    function removePendingOpsForTask(taskId: string) {
        setPendingOps((ops) => ops.filter((op) => op.task.id !== taskId));
    }

    const syncOps = useRef(
        debounce(() => {
            if (opsRef.current.length === 0) return;

            setIsSyncingOps(true);

            opsRef.current.forEach((op) => {
                const { type, task, connection } = op;

                switch (type.toLowerCase()) {
                    case 'create':
                        router.post(
                            route('tasks.store', { project: project.id }),
                            { id: task.id, x: task.x, y: task.y },
                            {
                                preserveScroll: true,
                                onError: (errors) => {
                                    toast.error('An error occurred when creating task.');
                                    console.error(errors);
                                },
                            },
                        );
                        break;

                    case 'update':
                        router.patch(
                            route('tasks.update', { project: project.id, task: task.id }),
                            { title: task.title, x: task.x, y: task.y },
                            {
                                preserveScroll: true,
                                onError: (errors) => {
                                    toast.error(task.title ? `Error updating task ${task.title}` : `Error updating task ${task.id}`);
                                    console.error(errors);
                                },
                            },
                        );
                        break;

                    case 'delete':
                        router.delete(route('tasks.destroy', { project: project.id, task_id: task.id }), {
                            preserveScroll: true,
                            onError: (errors) => {
                                toast.error(task.title ? `Error deleting task ${task.title}` : `Error deleting task ${task.id}`);
                                console.error(errors);
                            },
                        });
                        break;

                    case 'connect':
                        router.post(route('tasks.connect', { project: project.id }), {
                            source_id: connection.source_id,
                            target_id: connection.target_id,
                        });
                        break;

                    case 'disconnect':
                        router.post(route('tasks.disconnect', { project: project.id }), {
                            source_id: connection.source_id,
                            target_id: connection.target_id,
                        });
                        break;
                }
            });

            setPendingOps([]);
            setTimeout(() => setIsSyncingOps(false), 2000);
        }, debounceDelay),
    ).current;

    useEffect(() => {
        console.log('Pending Operations:', pendingOps);
    }, [pendingOps]);

    useEffect(() => {
        opsRef.current = pendingOps;
    }, [pendingOps]);

    useEffect(() => {
        if (pendingOps.length === 0) return;

        const handleOnBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleOnBeforeUnload, { capture: true });
        return () => window.removeEventListener('beforeunload', handleOnBeforeUnload, { capture: true });
    }, [pendingOps]);

    // ----------------------------------------------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------------------------------------------

    return (
        <main className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onNodeDragStop={(e, node) => {
                    queueOperation({
                        type: 'update',
                        task: {
                            id: node.id,
                            x: Math.trunc(node.position.x),
                            y: Math.trunc(node.position.y),
                        },
                    });
                }}
                fitView
                nodeTypes={{ Task }}
            >
                <Background />
                <TaskPanel createTask={createTask} />
                {isSyncingOps && <Loader />}
            </ReactFlow>
        </main>
    );
}
