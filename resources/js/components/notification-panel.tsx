import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInitials } from '@/hooks/use-initials';
import { Link } from '@inertiajs/react';
import { Bell, ChevronsRight, X } from 'lucide-react';
import { ReactNode } from 'react';

export default function NotificationPanel({ children, project_id }: { children: ReactNode; project_id: string }) {
    const getInitials = useInitials();

    const notifications = [
        {
            id: 1,
            assignedBy: {
                avatar: '/lorenzo.png',
                name: 'Doente Verde',
            },
            task: 'Fumar 1',
            subtask: 'bolar',
            dueDate: '2024-01-15',
            project: 'Sajique',
            time: 'há 2 horas',
            type: 'project',
        },
        {
            id: 2,
            assignedBy: {
                avatar: '/lorenzo.png',
                name: 'Doente Verde',
            },
            task: 'Fumar 1',
            subtask: 'acender',
            dueDate: '2024-01-15',
            project: 'Sajique',
            time: 'há 2 horas',
            type: 'project',
        },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent side="right" className="mb-2 flex h-[90vh] w-[28rem] flex-col p-0">
                <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
                    <div>
                        <h3 className="text-lg font-semibold">Tarefas Atribuídas</h3>
                        <p className="text-sm text-muted-foreground">{notifications.length} tarefas pendentes</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>Nenhuma tarefa atribuída</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((task) => (
                                <li key={task.id} className="p-4 transition-colors hover:bg-muted/50">
                                    <div className="flex gap-3">
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            <AvatarImage src={task.assignedBy.avatar || '/placeholder.svg'} alt={task.assignedBy.name} />
                                            <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(task.assignedBy.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <p className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                                                        <div>
                                                            <span className="font-medium text-accent-foreground">{task.assignedBy.name}</span>{' '}
                                                            attributed a task to you
                                                        </div>

                                                        <div className="py-1 text-xs text-accent-foreground">{task.project}</div>
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm leading-tight font-medium">
                                                        {task.task} <ChevronsRight size={20} />
                                                        <span>{task.subtask}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-xs text-muted-foreground">
                                                    <span>Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>{task.time}</span>
                                                </div>
                                                <Link href={`/${project_id}/kanban`} className="flex gap-2">
                                                    <Button size="sm" className="h-7 px-2 text-xs">
                                                        Ver Detalhes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex-shrink-0 border-t p-3">
                    <Button variant="outline" className="w-full bg-transparent text-sm">
                        Ver Todas as Tarefas
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
