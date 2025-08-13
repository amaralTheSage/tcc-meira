import { Column } from "@/types/models";
import { usePage, router } from "@inertiajs/react";
import { useEffect } from "react";
import { toast } from "sonner";
import ColumnContainer from "./column-container";

function KanbanBoard({ columns, setColumn }: { columns: Column[], setColumn: React.Dispatch<React.SetStateAction<Column[]>> }) {
    const safeColumns = columns ?? [];
    const project_id = usePage().url.split('/')[1];

    useEffect(() => {
        console.log(columns)
    }), [columns]

    function createColumn(e: React.MouseEvent) {
        e.preventDefault();

        const newColumnData = { position: safeColumns.length + 1 };

        router.post(
            route('column.store', { project: project_id }),
            newColumnData,
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setColumn([...safeColumns, newColumnData]);
                    router.reload({ only: ['columns'] })
                    toast.success('Column created successfuly')
                },
                onError: () => {
                    toast.error('An error occurred when creating the column.');
                }
            }
        );
    }
    

    const columnsContainer = columns.map(column => (
       <ColumnContainer key={column.id} columns={columns} column={column} setColumn={setColumn}/>
    ));

    return (
        <div className="flex overflow-x-hidden gap-2 p-2">
            {columnsContainer}
            <button className="h-10 w-36 rounded-lg bg-red-800 cursor-pointer text-white" onClick={createColumn}>
                + Add Column
            </button>
        </div>
    );
}

export default KanbanBoard;
