import { screenToFlowPositionType, SharedData } from '@/types';
import { Project, TraceboardNote, TraceboardTask, type BoardOperation } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { Background, Edge, Node, ReactFlow, useNodesState, type NodeChange, type NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { filterRemoteCursorNodesForUnlockedUsers, TRACEBOARD_LIVE_UPDATE_INTERVAL_MS, type TraceboardCursorWhisperPayload } from './cursor-smoothing';
import { CursorTracker } from './cursor-tracker';
import { createTraceboardNodeId } from './node-ids';
import Note from './note';
import TaskPanel from './panel';
import Task from './task';
import { queueTraceboardNodeDeletes, TRACEBOARD_NODE_DELETE_KEY_CODES, type TraceboardNodeDeleteCandidate } from './traceboard-node-deletes';
import {
    decorateTraceboardNodesWithTouchLocks,
    filterRemoteLockedTraceboardNodeChanges,
    isTraceboardContentNode,
    isTraceboardNodeRemoteLocked,
    isTraceboardOperationRemoteLocked,
    traceboardTouchLockUserIds,
    type TraceboardNodeTouchLocksByNode,
} from './traceboard-node-touch-locks';
import { listenForTraceboardPointerLocks } from './traceboard-pointer-touch-locks';
import { useBoardOperationQueue } from './use-board-operation-queue';
import { useSmoothedTraceboardCursors } from './use-smoothed-traceboard-cursors';
import { useSmoothedTraceboardNodeDrags } from './use-smoothed-traceboard-node-drags';
import { useTraceboardConnections } from './use-traceboard-connections';
import { useTraceboardNodeTouchLocks } from './use-traceboard-node-touch-locks';
import UserCursor from './user-cursor';

const SEND_INTERVAL = TRACEBOARD_LIVE_UPDATE_INTERVAL_MS;

interface BoardProps {
    tasks?: TraceboardTask[];
    project: Project;
    initialConnections: Edge[];
    initialNotes?: TraceboardNote[];
}

type UpdateNodeFunction = (id: string, update: (node: Node) => Partial<Node>) => void;

const traceboardNodeTypes = { Task, Note, UserCursor } as NodeTypes;

export default function Board({ tasks = [], project, initialConnections, initialNotes = [] }: BoardProps) {
    const { queueOperation: enqueueBoardOperation, removePendingOpsForTask } = useBoardOperationQueue(project.id);
    const boardElementRef = useRef<HTMLElement | null>(null);
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const touchLocks = useTraceboardNodeTouchLocks(auth.user);
    const { endTouchLock, nodeTouchLocks, startTouchLock } = touchLocks;
    const touchLocksRef = useRef<TraceboardNodeTouchLocksByNode>(nodeTouchLocks);

    useEffect(() => {
        touchLocksRef.current = nodeTouchLocks;
    }, [nodeTouchLocks]);

    const queueOperation = useCallback(
        (operation: BoardOperation): void => {
            if (isTraceboardOperationRemoteLocked(operation, touchLocksRef.current, auth.user.id)) {
                return;
            }

            enqueueBoardOperation(operation);
        },
        [auth.user.id, enqueueBoardOperation],
    );
    const deleteTraceboardNodes = useCallback(
        (nodesToDelete: TraceboardNodeDeleteCandidate[]): void => queueTraceboardNodeDeletes(nodesToDelete, removePendingOpsForTask, queueOperation),
        [queueOperation, removePendingOpsForTask],
    );

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
    const nodesRef = useRef<Node[]>(nodes);
    useSmoothedTraceboardNodeDrags(auth.user.id, nodes, setNodes);

    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    function DeleteNote(id: string) {
        deleteTraceboardNodes([{ id, type: 'Note' }]);
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
                sprint_id: task.sprint_id,
                sprints: project.sprints,
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
                        members: project.members,
                        projectTags: project.tags,
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

    useEffect(() => {
        const boardElement = boardElementRef.current;

        if (!boardElement) {
            return;
        }

        return listenForTraceboardPointerLocks(boardElement, nodesRef, touchLocksRef, auth.user.id, {
            endTouchLock: endTouchLock,
            startTouchLock: startTouchLock,
        });
    }, [auth.user.id, endTouchLock, startTouchLock]);

    // Drag Node
    const lastSentTime = useRef(0);
    const dragStartPositions = useRef(new Map<string, { x: number; y: number }>());
    const handleNodeDragStart = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (!isTraceboardContentNode(node) || isTraceboardNodeRemoteLocked(touchLocksRef.current[node.id], auth.user.id)) {
                return;
            }

            startTouchLock(node.id, node.type, 'drag');
            dragStartPositions.current.set(node.id, {
                x: Math.trunc(node.position.x),
                y: Math.trunc(node.position.y),
            });
        },
        [auth.user.id, startTouchLock],
    );

    const handleNodeDrag = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (!isTraceboardContentNode(node) || isTraceboardNodeRemoteLocked(touchLocksRef.current[node.id], auth.user.id)) {
                return;
            }

            const now = Date.now();
            if (now - lastSentTime.current >= SEND_INTERVAL) {
                lastSentTime.current = now;

                if (node.type === 'Task') {
                    router.patch(
                        route('tasks.move', { project: project.id, task: node.id }),
                        { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y), _undoable: false },
                        { preserveScroll: true },
                    );
                } else if (node.type === 'Note') {
                    router.patch(
                        route('notes.move', { project: project.id, note: node.id }),
                        { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y), _undoable: false },
                        { preserveScroll: true },
                    );
                }
            }
        },
        [auth.user.id, project.id],
    );

    const handleNodeDragStop = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            if (!isTraceboardContentNode(node)) {
                return;
            }

            endTouchLock(node.id, node.type, 'pointer');
            endTouchLock(node.id, node.type, 'drag');

            if (isTraceboardNodeRemoteLocked(touchLocksRef.current[node.id], auth.user.id)) {
                return;
            }

            const start = dragStartPositions.current.get(node.id) ?? {
                x: Math.trunc(node.position.x),
                y: Math.trunc(node.position.y),
            };
            dragStartPositions.current.delete(node.id);

            if (node.type === 'Task') {
                router.patch(
                    route('tasks.move', { project: project.id, task: node.id }),
                    { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y), _undoable: true, _undo_before: start },
                    { preserveScroll: true },
                );
            } else if (node.type === 'Note') {
                router.patch(
                    route('notes.move', { project: project.id, note: node.id }),
                    { x: Math.trunc(node.position.x), y: Math.trunc(node.position.y), _undoable: true, _undo_before: start },
                    { preserveScroll: true },
                );
            }
        },
        [auth.user.id, project.id, endTouchLock],
    );

    // ----------------------------------------------------------------------------------------------------------
    // EDGES
    // ----------------------------------------------------------------------------------------------------------

    const { edges, isValidConnection, onBeforeDelete, onConnect, onEdgesChange, onEdgesDelete } = useTraceboardConnections({
        animatedEdges: project.animated_edges,
        currentUserId: auth.user.id,
        edgeType: project.edge_type,
        initialConnections,
        nodeTouchLocks,
        nodes,
        queueOperation,
    });

    // ----------------------------------------------------------------------------------------------------------
    // MOUSE CURSORS
    // ----------------------------------------------------------------------------------------------------------

    const { channel } = useEcho<TraceboardCursorWhisperPayload>('cursor');
    const remoteCursorNodes = useSmoothedTraceboardCursors(channel);
    const hiddenCursorUserIds = useMemo(() => traceboardTouchLockUserIds(nodeTouchLocks), [nodeTouchLocks]);
    const visibleRemoteCursorNodes = useMemo(
        () => filterRemoteCursorNodesForUnlockedUsers(remoteCursorNodes, hiddenCursorUserIds),
        [hiddenCursorUserIds, remoteCursorNodes],
    );
    const lockedNodes = useMemo(
        () =>
            decorateTraceboardNodesWithTouchLocks(nodes, nodeTouchLocks, auth.user.id, {
                endTouchLock: endTouchLock,
                startTouchLock: startTouchLock,
            }),
        [auth.user.id, nodes, endTouchLock, nodeTouchLocks, startTouchLock],
    );
    const flowNodes = useMemo(() => [...lockedNodes, ...visibleRemoteCursorNodes], [lockedNodes, visibleRemoteCursorNodes]);
    const handleNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => onNodesChange(filterRemoteLockedTraceboardNodeChanges(changes, nodeTouchLocks, auth.user.id)),
        [auth.user.id, onNodesChange, nodeTouchLocks],
    );

    // ----------------------------------------------------------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------------------------------------------------------

    return (
        <main ref={boardElementRef} data-testid="traceboard-board" className="h-full w-full text-black">
            <ReactFlow
                nodes={flowNodes}
                edges={edges}
                proOptions={{ hideAttribution: true }}
                onConnect={onConnect}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onEdgesDelete={onEdgesDelete}
                onNodesDelete={deleteTraceboardNodes}
                onBeforeDelete={onBeforeDelete}
                deleteKeyCode={TRACEBOARD_NODE_DELETE_KEY_CODES}
                onNodeDragStart={handleNodeDragStart}
                onNodeDrag={handleNodeDrag}
                onNodeDragStop={handleNodeDragStop}
                isValidConnection={isValidConnection}
                fitView
                nodeTypes={traceboardNodeTypes}
            >
                <CursorTracker boardElementRef={boardElementRef} channel={channel} userId={auth.user.id} />
                <Background />
                <TaskPanel createNode={createNode} />
            </ReactFlow>
        </main>
    );
}
