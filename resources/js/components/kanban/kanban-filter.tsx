export default function kanbanFilter(){
    return (
        <div className="flex flex-col gap-2 py-2 px-4 float-end bg-neutral-800 rounded-md">
            <h4>Filters</h4>
            <div className="flex gap-3">
                <select className="w-28 p-1 rounded-sm bg-neutral-700" name="Members" id="members">
                    <option value="">Members</option>
                </select>
                <select className="w-28 p-1 rounded-sm bg-neutral-700" name="Tags" id="tags">
                    <option value="">Tags</option>
                </select>
                <select className="w-28 p-1 rounded-sm bg-neutral-700" name="Dates" id="date">
                    <option value="">Dates</option>
                </select>
                <button className="w-28 p-1 bg-white rounded-sm text-black">Clear</button>
            </div>
        </div>
    )
}