// To make the Traceboard, we relied heavily on the concept of "optimistic updates":
// Optimistic updates in React refer to a technique that enhances user experience by immediately updating the UI in response to user actions, without waiting for confirmation from the server. This approach creates a perception of speed and responsiveness, even if the actual server operation takes some time to complete.

// Keys: Optimistic Updates + Batched Persistence
// 1. Immediate local state updates: When a user creates/moves/edits a task, update your React state immediately. No backend calls.
// 2. Debounced/batched persistence: Send updates to the backend after a delay (500ms) or when the user stops interacting.
// 3. Conflict resolution: Handle cases where the backend state differs from local state.

import { Project, TraceboardTask } from '@/types/models';
import { router } from '@inertiajs/react';
import { Background, Controls, Edge, Node, Panel, ReactFlow, useEdgesState, useNodesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SquarePlus } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import Task from './task';

// Create context for task updates
const TaskUpdateContext = createContext<((taskId: string, updates: Partial<TraceboardTask>) => void) | null>(null);

export const useTaskUpdate = () => {
    const context = useContext(TaskUpdateContext);
    if (!context) {
        throw new Error('useTaskUpdate must be used within TaskUpdateContext');
    }
    return context;
};

function formatTasks(tasks: TraceboardTask[]): Node[] {
    return tasks.map((task) => ({
        id: task.id,
        type: 'Task',
        data: {
            title: task.title || '',
            image: task.image || null,
            // Add a flag to track if this is a local-only task
            isLocal: false,
        },
        measured: { width: 1, height: 1 },
        position: {
            x: task.x,
            y: task.y,
        },
    }));
}

const initialEdges: Edge[] = [];
const nodeTypes = { Task: Task };

// Debounce utility
function useDebounce(callback: Function, delay: number) {
    const timeoutRef = useRef<NodeJS.Timeout>(0);

    return useCallback(() => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => callback(), delay);
    }, [callback, delay]);
}

export default function Board({ tasks, project }: { tasks: TraceboardTask[]; project: Project }) {
    const [nodes, setNodes, onNodesChange] = useNodesState(formatTasks(tasks));
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    console.log(nodes);

    // Track changes that need to be persisted
    const pendingChangesRef = useRef<Map<string, any>>(new Map());

    // Debounced function to persist changes
    const persistChanges = useDebounce(() => {
        if (pendingChangesRef.current.size === 0) return;

        const changes = Array.from(pendingChangesRef.current.entries());
        pendingChangesRef.current.clear();

        // Batch update to backend
        router.patch(
            route('tasks.batch-update', { project: project.id }),
            {
                changes: changes.map(([id, data]) => ({ id, ...data })),
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }, 5000);

    // Update nodes when tasks prop changes (from other users or after persistence)
    useEffect(() => {
        setNodes((currentNodes) => {
            const serverTasks = formatTasks(tasks);
            // const serverTaskIds = new Set(serverTasks.map((t) => t.id));

            // Keep local-only nodes, update existing ones with server data
            return currentNodes
                .map((node) => {
                    if (node.data.isLocal) return node; // Keep local tasks as-is

                    const serverTask = serverTasks.find((t) => t.id === node.id);
                    return serverTask || node; // Use server data if available
                })
                .concat(
                    // Add new tasks from server that we don't have locally
                    serverTasks.filter((task) => !currentNodes.some((node) => node.id === task.id)),
                );
        });
    }, [tasks, setNodes]);

    // Optimistic task creation
    function createTask() {
        const tempId = `temp-${Date.now()}`;
        const newNode: Node = {
            id: tempId,
            type: 'Task',
            data: {
                title: '',
                image: null,
                isLocal: true,
            },
            measured: { width: 1, height: 1 },
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 400 + 100,
            },
        };

        // Add immediately to UI
        setNodes((nodes) => [...nodes, newNode]);

        // Create in backend
        router.post(
            route('tasks.store', { project: project.id }),
            {
                x: newNode.position.x,
                y: newNode.position.y,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    // Replace temp node with real one
                    const newTask = page.props.flash.newTask;
                    console.log('on success:', newTask);
                    setNodes((nodes) =>
                        nodes.map((node) => (node.id === tempId ? { ...node, id: newTask.id, data: { ...node.data, isLocal: false } } : node)),
                    );
                },
                onError: () => {
                    // Remove temp node on error
                    setNodes((nodes) => nodes.filter((node) => node.id !== tempId));
                },
            },
        );
    }

    // Handle node changes (position, etc.)
    const handleNodesChange = onNodesChange;

    const handleNodeDragStop = (event, node) => {
        pendingChangesRef.current.set(node.id, {
            ...pendingChangesRef.current.get(node.id),
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
        });
        persistChanges();
    };

    // useCallback(
    //     (changes) => {
    //         onNodesChange(changes);

    //         // Track position changes for persistence
    //         changes.forEach((change) => {
    //             if (change.type === 'position' && change.position && !change.dragging) {
    //                 // Only persist when drag is complete (not during dragging)
    //                 const existingChanges = pendingChangesRef.current.get(change.id) || {};
    //                 pendingChangesRef.current.set(change.id, {
    //                     ...existingChanges,
    //                     x: Math.round(change.position.x), // Round to avoid decimal precision issues
    //                     y: Math.round(change.position.y),
    //                 });
    //                 persistChanges();
    //             }
    //         });
    //     },
    //     [onNodesChange, persistChanges],
    // );

    // Optimistic task updates (title, etc.)
    const updateTask = useCallback(
        (taskId: string, updates: Partial<TraceboardTask>) => {
            // Update UI immediately
            setNodes((nodes) => nodes.map((node) => (node.id === taskId ? { ...node, data: { ...node.data, ...updates } } : node)));

            // Queue for persistence
            pendingChangesRef.current.set(taskId, {
                ...pendingChangesRef.current.get(taskId),
                ...updates,
            });
            persistChanges();
        },
        [setNodes, persistChanges],
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            const edge = {
                ...connection,
                id: `${connection.source}-${connection.target}`,
                markerEnd: 'arrowClosed',
            };
            setEdges((prevEdges) => addEdge(edge, prevEdges));

            // Persist edge creation immediately (or add to batch)
            router.post(
                route('edges.store', { project: project.id }),
                {
                    source: connection.source,
                    target: connection.target,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                },
            );
        },
        [setEdges, project.id],
    );

    return (
        <TaskUpdateContext.Provider value={updateTask}>
            <main className="h-full w-full text-black">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onConnect={onConnect}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDragStop={handleNodeDragStop}
                    fitView
                    nodeTypes={nodeTypes}
                >
                    <Background />
                    <Controls />
                    <Panel position="center-left" className="rounded-md bg-white p-2">
                        <SquarePlus onClick={createTask} className="cursor-pointer" />
                    </Panel>
                </ReactFlow>
            </main>
        </TaskUpdateContext.Provider>
    );
}
