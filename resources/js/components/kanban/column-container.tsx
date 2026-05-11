import { Column, ColumnTask, Project } from '@/types/models';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { CornerDownRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import TaskContainer from './task-container';

function ColumnContainer({
    column,
    columns,
    setColumn,
    project,
}: {
    columns: Column[];
    column: Column;
    setColumn: React.Dispatch<React.SetStateAction<Column[]>>;
    project: Project;
}) {
    const project_id = usePage().url.split('/')[1];

    const [tasks, setTasks] = useState<ColumnTask[]>([]);

    const [editMode, setEditMode] = useState(false);
    const [editingName, setEditingName] = useState(column.name || '');

    const [creatingTask, setCreatingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const tasksIds = useMemo(() => column.tasks?.map((task) => task.id) || [], [column.tasks]);

    useEcho<{ columnId: string; name: string }>('columns', 'ColumnNamed', (_payload) => {
        // Reload columns to include the newly added column
        router.reload({ only: ['columns'] });
    });

    useEcho<{ columnId: string }>('columns', 'ColumnRemove', (_payload) => {
        // Reload columns to include the newly added column
        router.reload({ only: ['columns'] });
    });

    function startCreatingTask(e: React.MouseEvent) {
        e.preventDefault();
        setCreatingTask(true);
        setNewTaskTitle('');
    }

    function createTask() {
        if (!newTaskTitle.trim()) return;

        const newTaskData = {
            id: crypto.randomUUID(),
            title: newTaskTitle.trim(),
            x: 0,
            y: 0,
            position: tasks.length + 1,
            column_id: column.id.toString(),
            project_id: project.id,
        };
        router.post(route('tasks.store', { project: project_id }), newTaskData, {
            preserveScroll: true,
            onSuccess: (page) => {
                const newTask = page.props.newTask as ColumnTask;
                setTasks([...tasks, newTask]);
                setCreatingTask(false);
                setNewTaskTitle('');
                toast.success('Task created successfuly');
            },
            onError: () => {
                toast.error('An error occurred when creating the task.');
            },
        });
    }

    function cancelCreatingTask() {
        setCreatingTask(false);
        setNewTaskTitle('');
    }

    function startEditingColumnName(): void {
        if (column.type !== 'standard') return;

        setEditMode(true);
        setEditingName(column.name || '');
    }

    function updateColumn(column: Column, name: string) {
        router.patch(
            route('column.update', { project: project_id, column: column }),
            { name },
            {
                onSuccess: () => {
                    const updatedColumns = columns.map((col) => (col.id === column.id ? { ...col, name } : col));
                    setColumn(updatedColumns);
                    toast.success('Column updated successfully');
                },
                onError: () => {
                    toast.error('An error occurred when updating the column.');
                },
            },
        );
    }

    function deleteColumn() {
        router.delete(route('column.destroy', { project: project_id, column: column.id }), {
            onSuccess: () => {
                setColumn(columns.filter((col) => col.id !== column.id));
                toast.success('Column deleted successfuly');
            },
            onError: () => {
                toast.error('An error occurred when deleting the column.');
            },
        });
    }

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: 'Column',
            column,
        },
        disabled: editMode,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const column_types = ['backlog', 'in_progress', 'to_do', 'done'];

    return (
        <div
            data-testid={`kanban-column-${column.id}`}
            ref={setNodeRef}
            style={style}
            className={`flex h-[calc(100svh-10.5rem)] w-80 shrink-0 flex-col rounded-md border border-border/70 bg-sidebar/60 shadow-sm shadow-black/20 ${isDragging ? 'border-red-700 opacity-65' : ''}`}
        >
            <div
                data-testid={`kanban-column-header-${column.id}`}
                onClick={startEditingColumnName}
                className="flex h-14 cursor-grab items-center justify-between gap-2 border-b border-border/70 px-3 text-sm text-foreground"
            >
                <button
                    data-testid={`kanban-column-drag-${column.id}`}
                    type="button"
                    aria-label="Drag column"
                    className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={(event) => event.stopPropagation()}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <p data-testid={`kanban-column-title-${column.id}`} className="truncate font-semibold" onClick={startEditingColumnName}>
                        {!editMode && (column.name || 'Untitled Column')}
                    </p>
                    {editMode && (
                        <input
                            data-testid={`kanban-column-name-input-${column.id}`}
                            value={editingName}
                            name="column-name"
                            className="max-w-44 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-red-800"
                            autoFocus
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                                updateColumn(column, editingName);
                                setEditMode(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateColumn(column, editingName);
                                    setEditMode(false);
                                }
                            }}
                        />
                    )}
                </div>
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-xs text-muted-foreground">{column.tasks?.length ?? 0}</span>
                {!column_types.includes(column.type) && (
                    <button
                        type="button"
                        data-testid={`kanban-column-delete-${column.id}`}
                        className="cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-red-950/30 hover:text-red-300"
                        onClick={deleteColumn}
                    >
                        <Trash2 className="size-4" />
                    </button>
                )}
                {(column.type == 'backlog' || column.type == 'done') && <CornerDownRight className="size-4 text-muted-foreground" />}
            </div>

            <div className="task-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                <SortableContext items={tasksIds}>
                    {column.tasks?.map((task) => (
                        <TaskContainer key={task.id} task={task} project_id={project.id} column={column} project={project} />
                    ))}
                </SortableContext>

                {creatingTask && (
                    <div className="flex h-12 items-center rounded-md border border-border/70 bg-background/80 px-3">
                        <input
                            data-testid={`kanban-new-task-input-${column.id}`}
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    createTask();
                                } else if (e.key === 'Escape') {
                                    cancelCreatingTask();
                                }
                            }}
                            placeholder="Task title..."
                            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <footer className="border-t border-border/70 p-2">
                <button
                    data-testid={`kanban-add-task-${column.id}`}
                    className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-red-950/20 hover:text-foreground"
                    onClick={startCreatingTask}
                >
                    <Plus className="size-4" />
                    Add task
                </button>
            </footer>
        </div>
    );
}

export default ColumnContainer;
