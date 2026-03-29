import { Column, Project } from "@/types/models";
import { useInitials } from '@/hooks/use-initials';
import KanbanFilter from "./kanban-filter";
import { User } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function KanbanHeader({ columns, filters, setFilters, project } : { columns:Column[], filters: {member: string, tag: string, date: string, sprint: string}, setFilters: React.Dispatch<React.SetStateAction<{member: string, tag: string, date: string, sprint: string}>>, project: Project }){

    const getInitials = useInitials();

    return(
        <div className="w-full flex flex-col md:flex-row gap-2 md:gap-0 justify-between items-center p-2 px-14 border-b-2 border-solid border-neutral-800">
            <div className="flex gap-2 items-center">
                <h1>{project.title}</h1>
                <div className="flex">
                    <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                        {
                            project.members.map((member: User) => (
                                <Avatar key={member.id}>
                                    <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))
                        }
                    </div>
                </div>
            </div>
            

            <KanbanFilter columns={columns} filters={filters} setFilters={setFilters} project={project}/>
        </div>
    )
}