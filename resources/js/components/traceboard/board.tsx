import { Project, TraceboardTask } from '@/types/models';
import { router } from '@inertiajs/react';
import { addEdge, Background, Connection, Edge, Node, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import Loader from '../loader';
import Note from './note';
import TaskPanel from './panel';
import Task from './task';

export default function Board({
    tasks = [],
    notes = [],
    project,
    initialConnections,
}: {
    tasks?: TraceboardTask[];
    notes?: { id: string; text: string; x: number; y: number }[];
    project: Project;
    initialConnections: Edge[];
}) {
    const debounceDelay = 5000;

    // ----------------------------------------------------------------------------------------------------------
    // NODE STATE + HELPERS
    // ----------------------------------------------------------------------------------------------------------

    const [nodes, setNodes, onNodesChange] = useNodesState(formatNodes(tasks, notes));

    function formatNodes(tasks: TraceboardTask[], notes: { id: string; text: string; x: number; y: number }[]): Node[] {
        const taskNodes = tasks.map((task) => ({
            id: task.id,
            type: 'Task',
            data: {
                members: project.members,
                title: task.title,
                image: task.image || null,
                completed: false, // TEMP
            },
            position: { x: task.x, y: task.y },
        }));

        const noteNodes = notes.map((note) => ({
            id: note.id,
            type: 'Note',
            data: { text: note.text },
            position: { x: note.x, y: note.y },
        }));

        return [...taskNodes, ...noteNodes];
    }

    function createNode(screenToFlowPosition, nodeType: 'Task' | 'Note') {
        const idPrefix = project.title
            .toLowerCase()
            .split(/[,;_ ]/)
            .join('-');
        const nodeId = `${idPrefix}_${crypto.randomUUID()}`;
        const flowPosition = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        const position = { x: Math.trunc(flowPosition.x), y: Math.trunc(flowPosition.y) };

        const newNode: Node = {
            id: nodeId,
            type: nodeType,
            data: nodeType === 'Task' ? { members: project.members, title: '', image: null, completed: false } : { text: '' },
            position,
        };

        setNodes((prev) => [...prev, newNode]);
        queueOperation({ type: 'create', node: { id: nodeId, x: position.x, y: position.y, nodeType } });
    }

    function removePendingOpsForNode(nodeId: string) {
        setPendingOps((ops) => ops.filter((op) => op.node?.id !== nodeId));
    }

    // ----------------------------------------------------------------------------------------------------------
    // EDGE STATE + HANDLERS
    // ----------------------------------------------------------------------------------------------------------

    const [edges, setEdges, onEdgesChange] = useEdgesState(initialConnections);

    const onConnect = useCallback(
        (connection: Connection) => {
            const targetNode = nodes.find((node) => node.id === connection.target);
            const isTargetCompleted = targetNode?.data?.completed || false;
            const edge: Edge = { ...connection, id: `${connection.source}-${connection.target}`, animated: !isTargetCompleted };

            setEdges((prev) => addEdge(edge, prev));
            queueOperation({ type: 'connect', connection: { source_id: connection.source, target_id: connection.target } });
        },
        [nodes],
    );

    function onEdgesDelete(edgesToDelete: Edge[]) {
        edgesToDelete.forEach((ed) => {
            queueOperation({ type: 'disconnect', connection: { source_id: ed.source, target_id: ed.target } });
        });
    }

    function updateEdgeAnimations(edges: Edge[], nodes: Node[]): Edge[] {
        return edges.map((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            return { ...edge, animated: !(targetNode?.data?.completed || false) };
        });
    }

    useEffect(() => {
        setEdges((current) => updateEdgeAnimations(current, nodes));
    }, [nodes]);

    // ----------------------------------------------------------------------------------------------------------
    // PENDING OPERATIONS QUEUE + SYNC
    // ----------------------------------------------------------------------------------------------------------

    const [pendingOps, setPendingOps] = useState<any[]>([]);
    const opsRef = useRef<any[]>(pendingOps);
    const [isSyncingOps, setIsSyncingOps] = useState<boolean>(false);

    function queueOperation(op: any) {
        setPendingOps((ops) => [...ops, op]);
        syncOps();
    }

    const syncOps = useRef(
        debounce(() => {
            if (opsRef.current.length === 0) return;

            setIsSyncingOps(true);
            opsRef.current.forEach((op) => {
                const { type, node, connection } = op;
                switch (type) {
                    case 'create': {
                        const url =
                            node.nodeType === 'Task' ? route('tasks.store', { project: project.id }) : route('notes.store', { project: project.id });
                        router.post(url, node, { preserveScroll: true });
                        break;
                    }
                    case 'update': {
                        const url =
                            node.nodeType === 'Task'
                                ? route('tasks.update', { project: project.id, task: node.id })
                                : route('notes.update', { project: project.id, note: node.id });
                        router.patch(url, node, { preserveScroll: true });
                        break;
                    }
                    case 'delete': {
                        const url =
                            node.nodeType === 'Task'
                                ? route('tasks.destroy', { project: project.id, task_id: node.id })
                                : route('notes.destroy', { project: project.id, note_id: node.id });
                        router.delete(url, { preserveScroll: true });
                        break;
                    }
                    case 'connect':
                        router.post(route('tasks.connect', { project: project.id }), connection);
                        break;
                    case 'disconnect':
                        router.post(route('tasks.disconnect', { project: project.id }), connection);
                        break;
                }
            });
            setPendingOps([]);
            setTimeout(() => setIsSyncingOps(false), 2000);
        }, debounceDelay),
    ).current;

    useEffect(() => {
        opsRef.current = pendingOps;
    }, [pendingOps]);

    useEffect(() => {
        if (pendingOps.length === 0) return;
        const onBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [pendingOps]);

    // ----------------------------------------------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------------------------------------------

    return (
        <main className="h-full w-full text-black">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                proOptions={{ hideAttribution: true }}
                onConnect={onConnect}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onNodeDragStop={(e, node) => {
                    queueOperation({
                        type: 'update',
                        node: { id: node.id, x: Math.trunc(node.position.x), y: Math.trunc(node.position.y), nodeType: node.type },
                    });
                }}
                fitView
                nodeTypes={{ Task, Note }}
            >
                <Background />
                <TaskPanel createNode={createNode} />
                {isSyncingOps && <Loader />}
            </ReactFlow>
        </main>
    );
}
