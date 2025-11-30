import { Column } from "@/types/models";
import { usePage } from "@inertiajs/react";

export default function kanbanFilter({columns} : {columns: Column[]}){
    const { props } = usePage();
    const project = props.project as { members?: any[] };


    
    return (
        <div className="flex flex-col gap-2 py-2 px-4 float-end bg-neutral-800 rounded-md">
            <h4>Filters</h4>
            <div className="flex gap-3">
                <select className="w-28 p-1 rounded-sm bg-neutral-700 cursor-pointer " name="Members" id="members">
                    <option value="">Members</option>
                    {project?.members?.map((user: any) => (
                        <option value={user.id}>{user.name}</option>
                    ))}
                </select>
                <select className="w-28 p-1 rounded-sm bg-neutral-700" name="Tags" id="tags">
                    <option value="">Tags</option>
                    {columns.map((column) => (
                        column.tasks?.map((task) => (
                            task.tags?.map((tag) => (
                                <option value={tag.id}>{tag.name}</option>
                            ))
                        ))
                    ))}
                </select>
                <select className="w-28 p-1 rounded-sm bg-neutral-700" name="Dates" id="date">
                    <option value="">Dates</option>
                </select>
                <button className="w-28 p-1 bg-white rounded-sm text-black">Clear</button>
            </div>
        </div>
    )
}