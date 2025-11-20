import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export default function UserTemplate({ template }) {
    const getInitials = useInitials();

    return (
        <li className="mb-1.5 flex w-full items-center justify-between rounded-md border border-[#e3e3e0] bg-white pr-4 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]">
            <div className="flex items-center gap-5">
                <img src="/landing-carousel/traceboard.png" alt={''} className="aspect-video w-36 rounded-l-md" />
                <div>
                    <h3 className="text-lg">{template.name}</h3>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-6 w-6 border">
                            <AvatarImage src={template.user.avatar} alt={template.user.name} className="object-cover" />
                            <AvatarFallback className="rounded-lg bg-neutral-200 text-sm text-black dark:bg-neutral-700 dark:text-white">
                                {getInitials(template.user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-sm font-light text-muted-foreground">{template.user.name}</p>
                    </div>
                </div>
            </div>

            <Button variant={'secondary'}>View </Button>
        </li>
    );
}
