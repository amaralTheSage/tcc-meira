import { Column } from "@/types/models";
import { usePage } from "@inertiajs/react";

export default function kanbanFilter({columns, filters, setFilters} : {columns: Column[], filters: {member: string, tag: string, date: string}, setFilters: React.Dispatch<React.SetStateAction<{member: string, tag: string, date: string}> >}){
    const { props } = usePage();
    const project = props.project as { members?: any[] };

    const uniqueTags = new Map();
    columns.forEach(column => {
        column.tasks?.forEach(task => {
            task.tags?.forEach(tag => {
                uniqueTags.set(tag.id, tag);
            });
        });
    });

    const handleClear = () => {
        setFilters({ member: '', tag: '', date: '' });
    };

    return (
        <div className="flex flex-col gap-2 py-2 px-4">
            <h4 className="text-center md:text-left">Filters</h4>
            <div className="flex gap-3">
                <select
                    className="md:w-28 w-20 p-1 rounded-sm bg-neutral-700 cursor-pointer"
                    name="Members"
                    id="members"
                    value={filters.member}
                    onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                >
                    <option value="">Members</option>
                    {project?.members?.map((user: any) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <select
                    className="md:w-28 w-20 p-1 rounded-sm bg-neutral-700"
                    name="Tags"
                    id="tags"
                    value={filters.tag}
                    onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                >
                    <option value="">Tags</option>
                    {Array.from(uniqueTags.values()).map((tag: any) => (
                        <option key={tag.id} value={tag.id}>{tag.name}</option>
                    ))}
                </select>
                <select
                    className="md:w-28 w-20 p-1 rounded-sm bg-neutral-700"
                    name="Dates"
                    id="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                >
                    <option value="">Dates</option>
                    {columns.map((column) => (
                        column.tasks?.map((task) => (
                            <option key={task.id} value={task.created_at}>{task.created_at}</option>
                        ))
                    ))}
                </select>
                <button className="md:w-28 w-20 p-1 bg-white rounded-sm text-black" onClick={handleClear}>Clear</button>
            </div>
        </div>
    )
}
