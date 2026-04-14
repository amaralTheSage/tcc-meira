import { screenToFlowPositionType, SharedData } from '@/types';
import { Project, TraceboardNote, TraceboardTask } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { addEdge, Background, Connection, Edge, Node, ReactFlow, useEdgesState, useNodesState, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CursorTracker } from './cursor-tracker';
import { createTraceboardNodeId } from './node-ids';
import Note from './note';
import TaskPanel from './panel';
import Task from './task';
import { useBoardOperationQueue } from './use-board-operation-queue';
import UserCursor from './user-cursor';

const SEND_INTERVAL = 800;
const CURSOR_UPDATE_INTERVAL = 300;
const INACTIVE_CURSOR_THRESHOLD = 10000;
const CURSOR_CLEANUP_INTERVAL = 30000;

interface BoardProps {
    tasks?: TraceboardTask[];
    project: Project;
    initialConnections: Edge[];
    initialNotes?: TraceboardNote[];
}

interface CursorWhisperPayload {
    id: number;
    x: number;
    y: number;
}

type UpdateNodeFunction = (id: string, update: (node: Node) => Partial<Node>) => void;

const traceboardNodeTypes = { Task, Note, UserCursor } as NodeTypes;

export default function Board({ tasks = [], project, initialConnections, initialNotes = [] }: BoardProps) {
    const { queueOperation, removePendingOpsForTask } = useBoardOperationQueue(project.id);

    // ----------------------------------------------------------------------------------------------------------
    // BROADCASTED CHANGES
    // ----------------------------------------------------------------------------------------------------------

    // Remove Node
    useEcho<{ nodeId: string; type: 'Task' | 'Note' }>('tasks', 'NodeRemoved', (e) => {
        setNodes((prevNodes) => prevNodes.filter((node) => node.id !== e.nodeId));
    });

    // Add Node
    useEcho<{ nodeId: string; type: 'Task' | 'Note'; x: number; y: number }>('tasks', 'NodeAdded', (payload) => {
        if (payload.type === 'Task') {
            setNodes((prev) => [
                ...prev,
                {
                    id: payload.nodeId,
                    data: {
                        members: project.members,
                        projectTags: project.tags,
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

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([...formatTasks(tasks), ...formatNotes(initialNotes)]);

    function DeleteNote(id: string) {
        removePendingOpsForTask(id);
        queueOperation({
            type: 'delete_note',
            task: {
                id: id,
            },
        });
    }

    function UpdateNoteText(updateNode: UpdateNodeFunction, text: string, id: string) {
        updateNode(id, (node) => ({
            ...node,
            data: {
                ...node.data,
                text,
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
    // TASK
    // ----------------------------------------------------------------------------------------------------------

    function formatTasks(tasks: TraceboardTask[]): Node[] {
        return tasks.map((task) => ({
            id: task.id,
            type: 'Task',
            data: {
                members: project.members,
                projectTags: project.tags,
                initialTags: task.tags,
                title: task.title,
                image: task.image || null,
                status: task.status,
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

    //----------------------------------------------------------------------------------------------------------
    // FUNCS THAT BOTH TASKS AND NOTES USE
    // ----------------------------------------------------------------------------------------------------------

    function createNode(screenToFlowPosition: screenToFlowPositionType, type: 'Note' | 'Task') {
        const nodeId = createTraceboardNodeId();
        const flowPosition = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        if (type === 'Task') {
            setNodes((prev) => [
                ...prev,
                {
                    id: nodeId,
                    data: {
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
    const lastSentTime = useRef(0);
    const handleNodeDrag = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            const now = Date.now();
            if (now - lastSentTime.current >= SEND_INTERVAL) {
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
        (_event: React.MouseEvent, node: Node) => {
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
    // EDGES
    // ----------------------------------------------------------------------------------------------------------

    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialConnections);

    const onConnect = useCallback(
        (connection: Connection) => {
            const targetNode = nodes.find((node) => node.id === connection.target);
            const isTargetCompleted = isNodeCompleted(targetNode);

            const edge: Edge = {
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
        [nodes, project.animated_edges, project.edge_type, queueOperation, setEdges],
    );

    function onEdgesDelete(edgesToDelete: Edge[]) {
        edgesToDelete.forEach((ed) => {
            queueOperation({
                type: 'disconnect',
                task: {},
                connection: { source_id: ed.source, target_id: ed.target },
            });
        });
    }

    const updateEdgeAnimations = useCallback(
        (edges: Edge[], nodes: Node[]): Edge[] => {
            return edges.map((edge) => {
                const targetNode = nodes.find((node) => node.id === edge.target);
                const isCompleted = isNodeCompleted(targetNode);
                return {
                    ...edge,
                    animated: project.animated_edges && !isCompleted,
                };
            });
        },
        [project.animated_edges],
    );

    useEffect(() => {
        setEdges((current) => updateEdgeAnimations(current, nodes));
    }, [nodes, setEdges, updateEdgeAnimations]);

    // ----------------------------------------------------------------------------------------------------------
    // MOUSE CURSOR SHIT
    // ----------------------------------------------------------------------------------------------------------

    const lastSent = useRef(0);
    const [clientPos, setClientPos] = useState({ x: 0, y: 0 });
    const [canvasCursorPosition, setCanvasCursorPosition] = useState<{ x: number; y: number } | null>(null);
    const page = usePage<SharedData>();
    const { auth } = page.props;

    const lastActiveRef = useRef<Record<number, number>>({});

    const { channel } = useEcho('cursor');

    channel().listenForWhisper('cursorMoved', (payload: CursorWhisperPayload) => {
        lastActiveRef.current[payload.id] = Date.now();

        setNodes((prev) => {
            const existingNode = prev.find((n) => n.id === payload.id.toString() && n.type === 'UserCursor');

            if (existingNode) {
                return prev.map((node) => (node.id === payload.id.toString() ? { ...node, position: { x: payload.x, y: payload.y } } : node));
            }

            return [
                ...prev,
                {
                    id: payload.id.toString(),
                    data: {},
                    type: 'UserCursor',
                    position: { x: payload.x, y: payload.y },
                },
            ];
        });
    });

    useEffect(() => {
        const now = Date.now();
        if (now - lastSent.current > CURSOR_UPDATE_INTERVAL) {
            if (!canvasCursorPosition) {
                return;
            }

            lastSent.current = now;

            channel().whisper('cursorMoved', {
                id: auth.user.id,
                x: canvasCursorPosition.x,
                y: canvasCursorPosition.y,
            });
        }
    }, [auth.user.id, canvasCursorPosition, channel]);

    // Clean up inactive cursors
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            setNodes((prev) =>
                prev.filter((node) => {
                    if (node.type !== 'UserCursor') return true;
                    const userId = parseInt(node.id);
                    const lastActive = lastActiveRef.current[userId];
                    return !lastActive || now - lastActive < INACTIVE_CURSOR_THRESHOLD;
                }),
            );
        }, CURSOR_CLEANUP_INTERVAL);

        return () => clearInterval(interval);
    }, [setNodes]);

    // ----------------------------------------------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------------------------------------------

    return (
        <main
            data-testid="traceboard-board"
            className="h-full w-full text-black"
            onMouseMove={(e) => {
                setClientPos({ x: e.clientX, y: e.clientY });
            }}
        >
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
                nodeTypes={traceboardNodeTypes}
            >
                <CursorTracker setCanvasCursorPosition={setCanvasCursorPosition} clientPos={clientPos} />
                <Background />
                <TaskPanel createNode={createNode} />
            </ReactFlow>
        </main>
    );
}

function isNodeCompleted(node: Node | undefined): boolean {
    return node?.data.status === 'completed';
}
