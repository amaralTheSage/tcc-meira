import { Column } from "@/types/models";
import { usePage, router } from "@inertiajs/react";
import { DndContext, DragOverlay, DragStartEvent, DragEndEvent, useSensor, PointerSensor, useSensors } from "@dnd-kit/core";
import { toast } from "sonner";
import ColumnContainer from "./column-container";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { SetStateAction, useMemo, useState } from "react";
import { createPortal } from "react-dom";

function KanbanBoard({ columns, setColumn }: { columns: Column[], setColumn: React.Dispatch<React.SetStateAction<Column[]>> }) {
    const safeColumns = columns ?? [];
    const project_id = usePage().url.split('/')[1];
    const columnId = useMemo(() => columns.map((col) => col.id), [columns])

    const [isActiveColumn, setIsActiveColumn] = useState<Column | null>(null);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint:{
            distance: 3,
        },
    }))


    function createColumn(e: React.MouseEvent) {
        e.preventDefault();

        const newColumnData = { position: safeColumns.length + 1 };

        router.post(
            route('column.store', { project: project_id }),
            newColumnData,
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Column created successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when creating the column.');
                }
            }
        );
    }

    function onDragStart(event: DragStartEvent){
        const data_type = event.active.data.current?.type
        const column_prop = event.active.data.current?.column

        if(data_type === "Column"){
            setIsActiveColumn(column_prop)
            return
        }
    }

    function onDragEnd(event: DragEndEvent){
        const {active, over} = event;
        if(!over) return;
        
        const activeColumnId = active.id;
        const overColumnId = over.id;

        if (activeColumnId === overColumnId) return;

        const newColumns = arrayMove(columns,
            columns.findIndex((col) => col.id === activeColumnId),
            columns.findIndex((col) => col.id === overColumnId)
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
                    }
                }
            );
    }
    

    const columnsContainer = columns.map(column => (
       <ColumnContainer key={column.id} columns={columns} column={column} setColumn={setColumn}/>
    ));

    return (
        <div className="flex min-h-fit  w-full m-auto overflow-x-scroll overflow-y-hidden gap-6 p-4">
            <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
                
                <SortableContext items={columnId}>
                    {columnsContainer}
                </SortableContext>
                <button className="h-10 shrink-0 w-36 rounded-lg bg-red-800 cursor-pointer text-white" onClick={createColumn}>
                    + Add Column
                </button>
                {createPortal(
                    <DragOverlay>
                        {isActiveColumn && (<ColumnContainer column={isActiveColumn} columns={columns} setColumn={setColumn} />)}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
            
        </div>
    );
}

export default KanbanBoard;
