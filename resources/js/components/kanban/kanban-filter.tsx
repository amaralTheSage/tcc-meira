import { Column, Project } from '@/types/models';

export default function kanbanFilter({
    columns,
    filters,
    setFilters,
    project,
}: {
    columns: Column[];
    filters: { member: string; tag: string; date: string; sprint: string };
    setFilters: React.Dispatch<React.SetStateAction<{ member: string; tag: string; date: string; sprint: string }>>;
    project: Project;
}) {
    const uniqueTags = new Map();
    columns.forEach((column) => {
        column.tasks?.forEach((task) => {
            task.tags?.forEach((tag) => {
                uniqueTags.set(tag.id, tag);
            });
        });
    });

    const handleClear = () => {
        setFilters({ member: '', tag: '', date: '', sprint: '' });
    };

    return (
        <div className="flex flex-col gap-2 px-4 py-2">
            <h4 className="text-center md:text-left">Filters</h4>
            <div className="flex gap-3">
                <select
                    className="w-20 cursor-pointer rounded-sm bg-neutral-700 p-1 md:w-28"
                    name="Members"
                    id="members"
                    value={filters.member}
                    onChange={(e) => setFilters({ ...filters, member: e.target.value })}
                >
                    <option value="">Members</option>
                    {project?.members?.map((user: any) => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                    ))}
                </select>
                <select
                    className="w-20 rounded-sm bg-neutral-700 p-1 md:w-28"
                    name="Tags"
                    id="tags"
                    value={filters.tag}
                    onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
                >
                    <option value="">Tags</option>
                    {Array.from(uniqueTags.values()).map((tag: any) => (
                        <option key={tag.id} value={tag.id}>
                            {tag.name}
                        </option>
                    ))}
                </select>
                <select
                    className="w-20 rounded-sm bg-neutral-700 p-1 md:w-28"
                    name="Dates"
                    id="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                >
                    <option value="">Dates</option>
                    {columns.map((column) =>
                        column.tasks?.map((task) => (
                            <option key={task.id} value={task.created_at}>
                                {task.created_at}
                            </option>
                        )),
                    )}
                </select>
                <select
                    className="w-20 cursor-pointer rounded-sm bg-neutral-700 p-1 md:w-28"
                    name="Sprint"
                    id="sprint"
                    value={filters.sprint}
                    onChange={(e) => setFilters({ ...filters, sprint: e.target.value })}
                >
                    <option value="">Sprints</option>
                    {project?.sprints?.map((sprint: any) => (
                        <option key={sprint.id} value={sprint.id}>
                            {sprint.title}
                        </option>
                    ))}
                </select>
                <button className="w-20 rounded-sm bg-white p-1 text-black md:w-28" onClick={handleClear}>
                    Clear
                </button>
            </div>
        </div>
    );
}
