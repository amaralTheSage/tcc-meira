import { screenToFlowPositionType } from '@/types';
import { Project, TraceboardNote, TraceboardTask } from '@/types/models';
import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { addEdge, Background, Connection, Edge, Node, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Loader from '../loader';
import Note from './note';
import TaskPanel from './panel';
import Task from './task';
import UserCursor from './user-cursor';

export default function Board({
    tasks = [],
    project,
    initialConnections,
    initialNotes,
}: {
    tasks?: TraceboardTask[];
    project: Project;
    initialNotes?: TraceboardNote[];
    initialConnections: Edge[];
}) {
    const debounceDelay = 200;

    // ----------------------------------------------------------------------------------------------------------
    // BROADCASTED CHANGES
    // ----------------------------------------------------------------------------------------------------------

    // Remove Node
    useEcho<{ nodeId: string; type: 'Task' | 'Note' }>('tasks', 'NodeRemoved', (e) => {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== e.nodeId));
    });

    // Add Node
    useEcho<{ nodeId: string; type: 'Task' | 'Note'; x: number; y: number }>('tasks', 'NodeAdded', (payload) => {
        console.log(payload);

        if (payload.type === 'Task') {
            setNodes((prev) => [
                ...prev,
                {
                    id: payload.nodeId,
                    data: {
                        members: project.members,
                        queueOperation,
                        formatTasks,
                        removePendingOpsForTask,
                    },
                    type: 'Task',
                    position: {
                        x: payload.x,
                        y: payload.y,
                    },
                },
            ]);
        } else if (payload.type === 'Note') {
            setNodes((prev) => [
                ...prev,
                {
                    id: payload.nodeId,
                    data: {
                        DeleteNote: DeleteNote,
                        UpdateNoteText: UpdateNoteText,
                    },
                    type: 'Note',
                    position: {
                        x: payload.x,
                        y: payload.y,
                    },
                },
            ]);
        }
    });

    // ----------------------------------------------------------------------------------------------------------
    // NOTES
    // ----------------------------------------------------------------------------------------------------------

    const [nodes, setNodes, onNodesChange] = useNodesState([
        ...formatTasks(tasks),
        ...formatNotes(initialNotes),
        { id: '1', type: 'UserCursor', data: {}, position: { x: 100, y: 100 } },
    ]);

    function DeleteNote(id: string) {
        removePendingOpsForTask(id);
        queueOperation({
            type: 'delete_note',
            task: {
                id: id,
            },
        });
    }

    function UpdateNoteText(updateNode, text, id) {
        updateNode(id, (node) => ({
            ...node,
            data: {
                ...node.data,
                text: text,
            },
        }));

        queueOperation({
            type: 'update_note',
            task: {
                id: id,
                text: text,
            },
        });
    }

    //----------------------------------------------------------------------------------------------------------
    // TASK STATE + HELPERS
    // ----------------------------------------------------------------------------------------------------------

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

    function formatNotes(notes: TraceboardNote[]): Node[] {
        return notes.map((note) => ({
            id: note.id,
            type: 'Note',
            data: {
                text: note.text,
                DeleteNote: DeleteNote,
                UpdateNoteText: UpdateNoteText,
            },
            measured: { width: 1, height: 1 },
            position: { x: note.x, y: note.y },
        }));
    }

    function createNode(screenToFlowPosition: screenToFlowPositionType, type: 'Note' | 'Task') {
        const nodeId = `${project.title
            .toLowerCase()
            .split(/[,;_ ]/)
            .join('-')}_${crypto.randomUUID()}`;

        const flowPosition = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        if (type === 'Task') {
            queueOperation({
                type: `create_task`,
                task: {
                    id: nodeId,
                    x: Math.trunc(flowPosition.x),
                    y: Math.trunc(flowPosition.y),
                },
            });
        } else if (type === 'Note') {
            queueOperation({
                type: `create_note`,
                task: {
                    id: nodeId,
                    x: Math.trunc(flowPosition.x),
                    y: Math.trunc(flowPosition.y),
                },
            });
        }
    }

    nodes.forEach((n) => {
        if (!n.data.formatTasks) {
            n.data.formatTasks = formatTasks;
        }
    });

    // Drag Node
    const [draggedNode, setDraggedNode] = useState(null);
    const lastSentTime = useRef(0);
    const sendInterval = 800; // ms
    const handleNodeDrag = useCallback(
        (_, node) => {
            setDraggedNode(node);

            const now = Date.now();
            if (now - lastSentTime.current >= sendInterval) {
                lastSentTime.current = now;

                if (node.type === 'Task') {
                    router.patch(
                        route('tasks.move', { project: project.id, task: node.id }),
                        { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y) },
                        { preserveScroll: true },
                    );
                } else if (node.type === 'Note') {
                    router.patch(
                        route('notes.move', { project: project.id, note: node.id }),
                        { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y) },
                        { preserveScroll: true },
                    );
                }
            }
        },
        [project.id],
    );

    const handleNodeDragStop = useCallback(
        (e, node) => {
            if (node.type === 'Task') {
                router.patch(
                    route('tasks.move', { project: project.id, task: node.id }),
                    { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y) },
                    { preserveScroll: true },
                );
            } else if (node.type === 'Note') {
                router.patch(
                    route('notes.move', { project: project.id, note: node.id }),
                    { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y) },
                    { preserveScroll: true },
                );
            }
        },
        [project.id],
    );

    // ----------------------------------------------------------------------------------------------------------
    // EDGE STATE + HANDLERS
    // ----------------------------------------------------------------------------------------------------------

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialConnections);

    const onConnect = useCallback(
        (connection: Connection) => {
            const targetNode = nodes.find((node) => node.id === connection.target);
            const isTargetCompleted = targetNode?.data?.completed;

            const edge = {
                ...connection,
                id: `${connection.source}-${connection.target}`,
                type: project.edge_type,
                animated: project.animated_edges && !isTargetCompleted,
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
            const isCompleted = targetNode?.data?.completed || false;
            return {
                ...edge,
                animated: project.animated_edges && !isCompleted,
            };
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
                    case 'create_note':
                        router.post(
                            route('notes.store', { project: project.id }),
                            { id: task.id, x: task.x, y: task.y },
                            {
                                preserveScroll: true,
                                onError: (errors) => {
                                    toast.error('An error occurred when creating note.');
                                    console.error(errors);
                                },
                            },
                        );
                        break;

                    case 'delete_note':
                        router.delete(route('notes.destroy', { project: project.id, note: task.id }), {
                            preserveScroll: true,
                            onError: (errors) => {
                                toast.error(task.title ? `Error deleting note` : `Error deleting note ${task.id}`);
                                console.error(errors);
                            },
                        });
                        break;
                    case 'update_note':
                        router.patch(
                            route('notes.update', { project: project.id, note: task.id }),
                            { text: task.text, x: task.x, y: task.y },
                            {
                                preserveScroll: true,
                                onError: (errors) => {
                                    toast.error(task.text ? `Error updating note` : `Error updating note ${task.id}`);
                                    console.error(errors);
                                },
                            },
                        );
                        break;

                    /*=============================================================== */
                    case 'create_task':
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
    // MOUSE CURSOR SHIT
    // ----------------------------------------------------------------------------------------------------------

    const lastSent = useRef(0);
    const [cursorsOnScreen, setCursorsOnScreen] = useState<{ x: number; y: number; id: number }[]>([]);

    useEcho<{ x: number; y: number; id: number }>('cursor', 'CursorMoved', (e) => {
        console.log(e.id);

        setCursorsOnScreen((cursors) => {
            const filtered = cursors.filter((c) => c.id !== e.id);
            return [...filtered, e];
        });

        setNodes((prev) => [
            ...prev,
            {
                id: e.id.toString(),
                data: {},
                type: 'UserCursor',
                position: {
                    x: e.x,
                    y: e.y,
                },
            },
        ]);
    });

    function handleCursorMove(e) {
        const now = Date.now();
        if (now - lastSent.current > 300) {
            lastSent.current = now;
            router.post(route('cursor', { project: project.id }), {
                x: e.clientX,
                y: e.clientY,
            });
        }
    }

    // ----------------------------------------------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------------------------------------------

    return (
        <main onMouseMove={handleCursorMove} className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                proOptions={{ hideAttribution: true }}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onNodeDrag={handleNodeDrag}
                onNodeDragStop={handleNodeDragStop}
                fitView
                nodeTypes={{ Task, Note, UserCursor }}
            >
                <Background />
                <TaskPanel createNode={createNode} />
                {isSyncingOps && <Loader />}
            </ReactFlow>
        </main>
    );
}
