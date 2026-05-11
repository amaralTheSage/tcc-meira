import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { Template } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export default function UserTemplate({ template, user }: { template: Template; user: User }) {
    const getInitials = useInitials();

    return (
        <li className="mb-1.5 flex w-full items-center justify-between rounded-md border border-border/70 bg-sidebar/60 pr-4 text-sm leading-normal text-foreground transition-colors hover:border-red-900/60 hover:bg-muted/40">
            <div className="flex items-center gap-5">
                <img src="/landing-carousel/traceboard.png" alt={''} className="aspect-video w-36 rounded-l-md" />
                <div>
                    <h3 className="text-lg">{template.name}</h3>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6 border">
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-light text-muted-foreground">{user.name}</p>
                    </div>
                </div>
            </div>

            <Link href={`/templates/${template.id}`}>
                <Button variant={'secondary'} className="cursor-pointer">
                    View{' '}
                </Button>
            </Link>
        </li>
    );
}
