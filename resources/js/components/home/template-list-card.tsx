import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export default function TemplateListCard({ template }: { template: any }) {
    const getInitials = useInitials();

    return (
        <li className="mb-1.5 flex w-full items-center justify-between rounded-md border border-[#e3e3e0] bg-white p-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={template.user.image} alt={template.user.name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(template.user.name)}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <h3>{template.name}</h3>
                </div>
            </div>

            <Button variant={'secondary'}>View </Button>
        </li>
    );
}
