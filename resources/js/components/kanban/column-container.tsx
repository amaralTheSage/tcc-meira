import { Column } from "@/types/models";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";


function ColumnContainer({ column, columns, setColumn }: { columns: Column[], column: Column, setColumn: React.Dispatch<React.SetStateAction<Column[]>> }) {
    const project_id = usePage().url.split('/')[1];

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
    return (
        <div className="h-96 w-2xs border-2 rounded-md border-gray-200 p-2">
            <button className="float-end" onClick={deleteColumn}>
                X
            </button>
        </div>
    );
}

export default ColumnContainer;
