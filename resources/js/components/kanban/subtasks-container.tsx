import { TaskSubtask } from '@/types/models';
import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function SubtaskContainer({ subtask, index, isDragging }: { subtask: TaskSubtask; index: number, isDragging: boolean }) {

    const getInitials = useInitials()
    return (
        <div className={`relative mb-0.5 flex items-center pl-4 ${isDragging ? 'opacity-65' : ''}`}>
            <div className="absolute top-3/5 left-2 h-0.5 w-2 -translate-y-1/2 transform bg-neutral-700"></div> {/* horizontal line */}
            <div className={`absolute left-2 w-0.5 bg-neutral-700 ${index >= 1 ? `-top-5 ${subtask.users?.length > 0 ? 'h-12' : 'h-11'}` : `-top-1 ${subtask.users?.length > 0 ? 'h-8' : 'h-7'}`}`}></div> {/* vertical line pointing right */}
            <div className="flex min-h-5 w-[98%] cursor-pointer items-center rounded-md border-2 border-solid bg-black py-1.5 duration-75 hover:border-solid hover:border-red-700">
                <div className="flex w-full items-center justify-between px-2">
                    <span className="truncate">{subtask.title || 'Untitled Task'}</span>
                    <div className='flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background'>
                        {subtask?.users?.map((user) => (
                            <Avatar key={user.id}>
                                <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                        ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}
