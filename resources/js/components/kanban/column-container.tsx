import { Column } from "@/types/models";
import { useSortable } from "@dnd-kit/sortable";
import { router, usePage } from "@inertiajs/react";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useState } from "react";


function ColumnContainer({ column, columns, setColumn }: { columns: Column[], column: Column, setColumn: React.Dispatch<React.SetStateAction<Column[]>> }) {
    const project_id = usePage().url.split('/')[1];

    const [editMode, setEditMode] = useState(false)
    const [editingName, setEditingName] = useState(column.name || "")

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

    const style = {transform: CSS.Transform.toString(transform), 
                   transition}
    
    if(isDragging){
        return <div ref={ setNodeRef } 
                    style={ style } 
                    className="h-96 max-h-96 opacity-65 border-2 border-red-800 bg-neutral-800 w-64 rounded-md p-2 flex flex-col">
                </div>
    }
        
    return (
        <div ref={ setNodeRef } style={ style } className="h-96 max-h-96 shrink-0 bg-neutral-800 w-64 rounded-md p-2 flex flex-col">
            <div {...attributes} {...listeners} onClick={ () => { setEditMode(true); setEditingName(column.name || "") } } className="h-12 text-lg p-1 flex justify-between items-center font-bold cursor-grab text-gray-400">
                {!editMode && (column.name || "Untitled Column")}
                {editMode && <input value={editingName}
                                    className="focus:border-red-800 border rounded outline-none px-2"
                                    autoFocus
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={ () => { updateColumn(column, editingName); setEditMode(false) } }
                                    onKeyDown={ (e) => {
                                        if(e.key === "Enter"){
                                            updateColumn(column, editingName); setEditMode(false)
                                        }
                                    }}/>}
                <button className="float-end cursor-pointer" onClick={deleteColumn}>
                    X
                </button>
            </div>
            
            <div className="flex flex-grow">Conteudo</div>
            <footer className="float-end">+ Adicionar task</footer>
        </div>
    );
}

export default ColumnContainer;
