import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useInitials } from '@/hooks/use-initials';
import { Bell, X } from 'lucide-react';

export default function HomeNotificationMenu() {
    const getInitials = useInitials();

    const notifications = [
        {
            id: 1,
            user: {
                name: 'lorenzo gonçalves',
                avatar: '/lorenzo.png',
                displayName: 'O duende',
            },
            message: 'convidou você para participar do projeto',
            project: '[Projeto]',
            time: 'há 2 horas',
            type: 'invitation',
        },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                {notifications.length > 0 && (
                    <div className="relative cursor-pointer">
                        <Bell />
                        <div className="absolute top-0.5 right-0 size-2.5 rounded-full bg-red-400 shadow-md"></div>
                    </div>
                )}
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-96 p-0">
                <div className="flex items-center justify-between border-b p-4">
                    <h3 className="text-lg font-semibold">Notificações</h3>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
                            <p>Nenhuma notificação</p>
                        </div>
                    ) : (
                        <ul className="divide-y">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="p-4 transition-colors hover:bg-muted/50">
                                    <div className="flex gap-3">
                                        <Avatar className="h-12 w-12 flex-shrink-0">
                                            <AvatarImage src={notification.user.avatar || '/placeholder.svg'} alt={notification.user.name} />
                                            <AvatarFallback className="bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(notification.user.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 text-sm">
                                                <span className="font-semibold">{notification.user.displayName}</span>
                                                <span className="text-muted-foreground"> {notification.message} </span>
                                                <span className="font-medium">{notification.project}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">{notification.time}</span>

                                                <Button size="sm" className="ml-auto px-3 pt-1 pb-0.5 text-xs font-semibold">
                                                    Participar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
