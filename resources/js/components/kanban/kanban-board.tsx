import { Column, ColumnTask, Project } from '@/types/models';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
    applySubtaskAssignmentToColumns,
    applyTaskAssignmentToColumns,
    type SubtaskAssignmentPayload,
    type TaskAssignmentPayload,
} from './assignment-events';
import ColumnContainer from './column-container';
import KanbanHeader from './kanban-header';
import TaskContainer from './task-container';

function KanbanBoard({
    columns,
    setColumn,
    project,
}: {
    columns: Column[];
    setColumn: React.Dispatch<React.SetStateAction<Column[]>>;
    project: Project;
}) {
    const safeColumns = columns ?? [];
    const project_id = usePage().url.split('/')[1];
    const columnId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [isActiveColumn, setIsActiveColumn] = useState<Column | null>(null);
    const [isActiveTask, setIsActiveTask] = useState<ColumnTask | null>(null);

    const [filters, setFilters] = useState({ member: '', tag: '', date: '', sprint: '' });

    const filteredColumns = columns.map((col) => ({
        ...col,
        tasks: col.tasks?.filter((task) => {
            if (filters.member && !task.users?.some((u) => u.id.toString() === filters.member)) return false;
            if (filters.tag && !task.tags?.some((t) => t.id.toString() === filters.tag)) return false;
            if (filters.sprint && task.sprint_id?.toString() !== filters.sprint) return false;
            return true;
        }),
    }));

    useEcho<{ nodeId: string; type: 'Task' | 'Note'; x: number; y: number }>('tasks', 'NodeAdded', (payload) => {
        if (payload.type === 'Task') {
            router.reload({ only: ['columns'] });
        }
    });

    useEcho<{ nodeId: string; type: 'Task' | 'Note' }>('tasks', 'NodeRemoved', (payload) => {
        if (payload.type === 'Task') {
            router.reload({ only: ['columns'] });
        }
    });

    useEcho<{ columnId: string; position: number }>('columns', 'ColumnAdded', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<{ columnId: string; position: number }>('columns', 'ColumnMoved', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<{ nodeId: string; type: 'Task' | 'Note'; text: string }>('tasks', 'NodeRenamed', (payload) => {
        if (payload.type === 'Task') {
            router.reload({ only: ['columns'] });
        }
    });

    useEcho<{ taskId: string; position: number; columnId: string }>('tasks', 'TaskMoved', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<{ subtaskId: string; title: string }>('subtasks', 'SubtaskAdded', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<{ taskId: string; text: string }>('tasks', 'TaskDescription', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<TaskAssignmentPayload>('tasks_users', 'TaskAssignedUser', (payload) => {
        setColumn((currentColumns) => applyTaskAssignmentToColumns(currentColumns, payload, project.id));
    });

    useEcho<SubtaskAssignmentPayload>('subtasks_users', 'SubtaskAssignedUser', (payload) => {
        setColumn((currentColumns) => applySubtaskAssignmentToColumns(currentColumns, payload, project.id));
    });

    useEcho<{ taskId: string; image: string | null }>('tasks', 'TaskImageUpdated', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    useEcho<{ subtaskId: string; completed: boolean }>('subtasks', 'SubtaskComplete', (_payload) => {
        router.reload({ only: ['columns'] });
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        }),
    );

    function createColumn(e: React.MouseEvent) {
        e.preventDefault();

        const newColumnData = { position: safeColumns.length + 1 };

        router.post(route('column.store', { project: project_id }), newColumnData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Column created successfuly');
            },
            onError: () => {
                toast.error('An error occurred when creating the column.');
            },
        });
    }

    function onDragStart(event: DragStartEvent) {
        const data_type = event.active.data.current?.type;
        const column_prop = event.active.data.current?.column;
        const task_prop = event.active.data.current?.task;

        if (data_type === 'Column') {
            setIsActiveColumn(column_prop);
            return;
        }

        if (data_type === 'Task') {
            setIsActiveTask(task_prop);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        if (activeType === 'Column') {
            const activeColumnId = active.id;
            const overColumnId = over.id;

            if (activeColumnId === overColumnId) return;

            const newColumns = arrayMove(
                columns,
                columns.findIndex((col) => col.id === activeColumnId),
                columns.findIndex((col) => col.id === overColumnId),
            );

            setColumn(newColumns);

            router.patch(
                route('column.reorder', { project: project_id }),
                {
                    columns: newColumns.map((col, index) => ({
                        id: col.id,
                        position: index,
                    })),
                },
                {
                    onError: () => {
                        toast.error('Ocorreu um erro ao reordenar as colunas.');
                    },
                },
            );
        }

        if (activeType === 'Task' && overType === 'Column') {
            const taskId = active.id;
            const newColumnId = over.id;

            // Find the task and move it to the new column
            const task = columns.flatMap((col) => col.tasks || []).find((t) => t.id === taskId);
            if (!task) return;

            const oldColumn = columns.find((col) => col.tasks?.some((t) => t.id === taskId));
            if (!oldColumn || oldColumn.id === newColumnId) return;

            // Update task column_id
            const newColumn = columns.find((col) => col.id === newColumnId);
            const newPosition = (newColumn?.tasks?.length || 0) + 1;

            const updateData: { column_id: string; position: number; status?: ColumnTask['status'] } = {
                column_id: newColumnId.toString(),
                position: newPosition,
            };
            if (newColumn?.type === 'done') {
                updateData.status = 'completed';
            } else if (newColumn?.type === 'in_progress') {
                updateData.status = 'in_progress';
            } else if (newColumn?.type === 'to_do') {
                updateData.status = 'pending';
            }

            router.patch(route('tasks.update', { project: project_id, task: taskId }), updateData, {
                preserveScroll: true,
                onSuccess: () => {
                    // Refresh columns to reflect the change
                    router.reload({ only: ['columns'] });
                    toast.success('Task moved successfully');
                },
                onError: () => {
                    toast.error('An error occurred when moving the task.');
                    // Revert optimistic update on error
                    router.reload({ only: ['columns'] });
                },
            });
        }

        if (activeType === 'Task' && overType === 'Task') {
            const activeTaskId = active.id;
            const overTaskId = over.id;

            // Find the tasks
            const activeTask = columns.flatMap((col) => col.tasks || []).find((t) => t.id === activeTaskId);
            const overTask = columns.flatMap((col) => col.tasks || []).find((t) => t.id === overTaskId);

            if (!activeTask || !overTask) return;

            const activeColumn = columns.find((col) => col.tasks?.some((t) => t.id === activeTaskId));
            const overColumn = columns.find((col) => col.tasks?.some((t) => t.id === overTaskId));

            if (!activeColumn || !overColumn) return;

            if (activeColumn.id === overColumn.id) {
                // Reorder within the same column
                const tasks = activeColumn.tasks || [];
                const oldIndex = tasks.findIndex((t) => t.id === activeTaskId);
                const newIndex = tasks.findIndex((t) => t.id === overTaskId);

                const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);

                // Optimistically update the state first
                const updatedColumns = columns.map((col) => {
                    if (col.id === activeColumn.id) {
                        return { ...col, tasks: reorderedTasks };
                    }
                    return col;
                });
                setColumn(updatedColumns);

                // Then update positions in the backend
                reorderedTasks.forEach((task, index) => {
                    router.patch(
                        route('tasks.update', { project: project_id, task: task.id }),
                        { position: index + 1 },
                        {
                            preserveScroll: true,
                            onError: () => {
                                toast.error('An error occurred when reordering the task.');
                                // Revert on error
                                setColumn(columns);
                            },
                        },
                    );
                });
            } else {
                // Move to different column
                const overTasks = overColumn.tasks || [];
                const newIndex = overTasks.findIndex((t) => t.id === overTaskId);

                // Insert the task at the new position
                const updatedOverTasks = [...overTasks];
                updatedOverTasks.splice(newIndex, 0, activeTask);

                // Update the moved task's column and position

                router.patch(
                    route('tasks.update', { project: project_id, task: activeTaskId }),
                    { column_id: overColumn.id.toString(), position: newIndex + 1 },
                    {
                        preserveScroll: true,
                        onError: () => {
                            toast.error('An error occurred when moving the task.');
                        },
                    },
                );

                // Update positions for tasks after the insertion point in the new column
                updatedOverTasks.slice(newIndex + 1).forEach((task, index) => {
                    router.patch(
                        route('tasks.update', { project: project_id, task: task.id }),
                        { position: newIndex + 2 + index },
                        {
                            preserveScroll: true,
                            onError: () => {
                                toast.error('An error occurred when moving the task.');
                            },
                        },
                    );
                });

                // Update positions for remaining tasks in the source column
                const updatedActiveTasks = activeColumn.tasks?.filter((t) => t.id !== activeTaskId) || [];
                updatedActiveTasks.forEach((task, index) => {
                    const isLast = index === updatedActiveTasks.length - 1;
                    router.patch(
                        route('tasks.update', { project: project_id, task: task.id }),
                        { position: index + 1 },
                        {
                            preserveScroll: true,
                            onSuccess: isLast ? () => router.reload({ only: ['columns'] }) : undefined,
                            onError: () => {
                                toast.error('An error occurred when moving the task.');
                            },
                        },
                    );
                });

                // Optimistically update the state
                const updatedColumns = columns.map((col) => {
                    if (col.id === overColumn.id) {
                        return { ...col, tasks: updatedOverTasks };
                    } else if (col.id === activeColumn.id) {
                        return { ...col, tasks: updatedActiveTasks };
                    }
                    return col;
                });
                setColumn(updatedColumns);

                toast.success('Task moved successfully');
            }
        }

        // Reset active states
        setIsActiveColumn(null);
        setIsActiveTask(null);
    }

    const columnsContainer = filteredColumns.map((column) => (
        <ColumnContainer key={column.id} columns={filteredColumns} column={column} setColumn={setColumn} project={project} />
    ));

    return (
        <>
            <KanbanHeader columns={columns} filters={filters} setFilters={setFilters} project={project} />

            <div data-testid="kanban-board" className="custom-scrollbar mt-6 ml-7 flex min-h-dvh w-full gap-6 overflow-x-scroll overflow-y-hidden">
                <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                    <SortableContext items={columnId}>{columnsContainer}</SortableContext>
                    <button
                        data-testid="kanban-add-column"
                        className="h-10 w-36 shrink-0 cursor-pointer rounded-lg bg-red-800 text-white"
                        onClick={createColumn}
                    >
                        + Add Column
                    </button>
                    {createPortal(
                        <DragOverlay>
                            {isActiveColumn && <ColumnContainer column={isActiveColumn} columns={columns} setColumn={setColumn} project={project} />}
                            {isActiveTask && (
                                <TaskContainer
                                    task={isActiveTask}
                                    project_id={project.id}
                                    project={project}
                                    column={columns.find((col) => col.tasks?.some((t) => t.id === isActiveTask.id))}
                                />
                            )}
                        </DragOverlay>,
                        document.body,
                    )}
                </DndContext>
            </div>
        </>
    );
}

export default KanbanBoard;
