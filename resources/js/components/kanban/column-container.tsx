import { Column, ColumnTask, Project } from '@/types/models';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
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
            className={`flex h-[46rem] w-80 shrink-0 flex-col rounded-sm bg-neutral-900 p-1.5 ${isDragging ? 'border-2 border-solid border-red-700 opacity-65' : ''}`}
        >
            <div
                data-testid={`kanban-column-header-${column.id}`}
                onClick={startEditingColumnName}
                className="flex h-12 cursor-grab items-center justify-between border-b-2 border-solid border-neutral-950 p-1 text-lg font-bold text-gray-400 shadow-2xs shadow-neutral-950"
            >
                <button
                    data-testid={`kanban-column-drag-${column.id}`}
                    type="button"
                    aria-label="Drag column"
                    className="cursor-grab px-1"
                    onClick={(event) => event.stopPropagation()}
                    {...attributes}
                    {...listeners}
                >
                    <i className="fa-solid fa-grip-vertical"></i>
                </button>
                <div className="min-w-0 flex-1">
                    <p data-testid={`kanban-column-title-${column.id}`} className="cursor-text text-xs" onClick={startEditingColumnName}>
                        {!editMode && (column.name || 'Untitled Column')}
                    </p>
                    {editMode && (
                        <input
                            data-testid={`kanban-column-name-input-${column.id}`}
                            value={editingName}
                            name="column-name"
                            className="max-w-44 rounded border px-2 outline-none focus:border-red-800"
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
                {!column_types.includes(column.type) && (
                    <button type="button" data-testid={`kanban-column-delete-${column.id}`} className="float-end cursor-pointer" onClick={deleteColumn}>
                        <i className="fa-solid fa-trash hover:text-red-700"></i>
                    </button>
                )}
                {(column.type == 'backlog' || column.type == 'done') && <i className="fa-solid fa-arrow-turn-down"></i>}
            </div>

            <div className="task-scrollbar mt-4 flex h-full flex-col overflow-y-scroll">
                <SortableContext items={tasksIds}>
                    {column.tasks?.map((task) => (
                        <TaskContainer key={task.id} task={task} project_id={project.id} column={column} project={project} />
                    ))}
                </SortableContext>

                {creatingTask && (
                    <div className="mb-2 flex h-12 w-64 items-center rounded-md bg-neutral-600 p-2">
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
                            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <footer className="float-end">
                <button
                    data-testid={`kanban-add-task-${column.id}`}
                    className="w-full cursor-pointer border-t-2 border-solid border-neutral-950 p-1 hover:text-red-700"
                    onClick={startCreatingTask}
                >
                    + Add task
                </button>
            </footer>
        </div>
    );
}

export default ColumnContainer;
