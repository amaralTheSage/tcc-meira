import { Column, ColumnTask, Project } from "@/types/models";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { router, usePage } from "@inertiajs/react";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import TaskContainer from "./task-container";
import { useEcho } from "@laravel/echo-react";


function ColumnContainer({ column, columns, setColumn, project }: { columns: Column[], column: Column, setColumn: React.Dispatch<React.SetStateAction<Column[]>>, project: Project }) {
    const project_id = usePage().url.split('/')[1];

    const [tasks, setTasks] = useState<ColumnTask[]>([]);

    const [editMode, setEditMode] = useState(false)
    const [editingName, setEditingName] = useState(column.name || "")

    const [creatingTask, setCreatingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState("")

    const tasksIds = useMemo(() => column.tasks?.map(task => task.id) || [], [column.tasks]);

    useEcho<{ columnId: string; name:string }>('columns', 'ColumnNamed', (payload) => {
        // Reload columns to include the newly added column
        router.reload({ only: ['columns'] });
    })

    useEcho<{ columnId: string; }>('columns', 'ColumnRemove', (payload) => {
        // Reload columns to include the newly added column
        router.reload({ only: ['columns'] });
    })

    function startCreatingTask(e: React.MouseEvent){
        e.preventDefault();
        setCreatingTask(true);
        setNewTaskTitle("");
    }

    function createTask(){
        if (!newTaskTitle.trim()) return;

        const newTaskData = { id: crypto.randomUUID(), title: newTaskTitle.trim(), x: 0, y: 0, position: tasks.length + 1, column_id: column.id.toString(), project_id: project.id };
        router.post(
            route('tasks.store', { project: project_id }),
            newTaskData,
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const newTask = page.props.newTask as ColumnTask;
                    setTasks([...tasks, newTask]);
                    setCreatingTask(false);
                    setNewTaskTitle("");
                    toast.success('Task created successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when creating the task.');
                }
            }
        );
    }

    function cancelCreatingTask(){
        setCreatingTask(false);
        setNewTaskTitle("");
    }


    function updateColumn(column: Column, name: string) {
        router.patch(
            route('column.update', { project: project_id, column: column }),
            { name },
            {
                onSuccess: () => {
                    const updatedColumns = columns.map((col) =>
                        col.id === column.id ? { ...col, name } : col
                    );
                    setColumn(updatedColumns);
                    toast.success('Column updated successfully');
                },
                onError: () => {
                    toast.error('An error occurred when updating the column.');
                }
            }
        );
    }

    function deleteColumn(){
        router.delete(
            route('column.destroy', { project: project_id, column: column.id }),
            {
                onSuccess: (page) => {
                    setColumn(columns.filter((col) => col.id !== column.id));
                    toast.success('Column deleted successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when deleting the column.');
                }
            }
        )
    }



    const { setNodeRef, attributes, listeners,
         transform, transition, isDragging } =
         useSortable({
            id: column.id,
            data: {
                type: "Column",
                column
            },
            disabled: editMode,
        })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition
    };

    const column_types = ['backlog', 'in_progress', 'to_do', 'done']
        

    return (
        <div ref={ setNodeRef } style={ style } className={`h-[46rem] shrink-0 bg-neutral-900 w-80 rounded-sm p-1.5 flex flex-col ${isDragging ? 'opacity-65 border-solid border-2 border-red-700' : ''}`}>
            <div {...attributes} {...listeners} onClick={ () => {if (column.type === 'standard') setEditMode(true); setEditingName(column.name || "") } } className="h-12 text-lg p-1 flex justify-between items-center font-bold cursor-grab text-gray-400 shadow-2xs shadow-neutral-950 border-b-2 border-solid border-neutral-950">
                <p className="text-xs">{!editMode && (column.name || "Untitled Column")}</p>
                {editMode && <input value={editingName}
                                    name="column-name"
                                    className="focus:border-red-800 max-w-44 border rounded outline-none px-2"
                                    autoFocus
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={ () => { updateColumn(column, editingName); setEditMode(false) } }
                                    onKeyDown={ (e) => {
                                        if(e.key === "Enter"){
                                            updateColumn(column, editingName); setEditMode(false)
                                        }
                                    }}/>}
                {!column_types.includes(column.type) && 
                    <button className="float-end cursor-pointer" onClick={deleteColumn}>
                        <i className="fa-solid fa-trash hover:text-red-700"></i>
                    </button>
                }
                {(column.type == "backlog" || column.type == "done") &&
                    <i className="fa-solid fa-arrow-turn-down"></i>
                }
                
                
            </div>
            
            <div className="flex flex-col h-full mt-4 overflow-y-scroll task-scrollbar">
                <SortableContext items={tasksIds}>
                    {column.tasks?.map ((task) => (
                        <TaskContainer key={task.id} task={task} project_id={project.id} column={column} project={project} />
                     ))}
                </SortableContext>
                
                {creatingTask && (
                    <div className="h-12 bg-neutral-600 w-64 rounded-md mb-2 p-2 flex items-center">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    createTask();
                                } else if (e.key === "Escape") {
                                    cancelCreatingTask();
                                }
                            }}
                            placeholder="Task title..."
                            className="flex-1 bg-transparent outline-none text-white placeholder-gray-400"
                            autoFocus
                        />
                    </div>
                )}
            </div>

            <footer className="float-end"><button className="hover:text-red-700 cursor-pointer border-t-2 border-solid border-neutral-950 w-full p-1" onClick={startCreatingTask}>+ Add task</button></footer>
        </div>
    );
}

export default ColumnContainer;
