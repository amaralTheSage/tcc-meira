import { ChevronsRight } from 'lucide-react';
import { useInitials } from '../hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function NotificationCard() {
    const getInitials = useInitials();

    return (
        <li className="flex items-center gap-2">
            <Avatar className="my-4 h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage src="/lorenzo.png" alt="lorenzo gonçalves" />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials('lorenzo gonçalves')}
                </AvatarFallback>
            </Avatar>

            <div className="text-sm text-nowrap">
                <div className="flex gap-1 font-bold">
                    <span>[USER] </span> <span className="font-medium"> atribuiu uma tarefa a você em </span>
                    <span>[Projeto]</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span>[TASK]</span> <ChevronsRight size={22} /> <span className="font-bold">[SUBTASK]</span>
                </div>
                <p className="text-right text-muted-foreground">há 2 horas</p>
            </div>
        </li>
    );
}




