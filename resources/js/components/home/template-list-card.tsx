import { useInitials } from '@/hooks/use-initials';
import { Template } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';

export default function TemplateListCard({ template }: { template: Template }) {
    const getInitials = useInitials();

    return (
        <li className="mb-1.5 flex w-full items-center justify-between rounded-md border border-border/70 bg-sidebar/60 p-2 text-sm leading-normal text-foreground transition-colors hover:border-red-900/60 hover:bg-muted/40">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={template.user.avatar} alt={template.user.name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(template.user.name)}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <h3>{template.name}</h3>
                </div>
            </div>

            <Button variant="secondary" asChild>
                <Link data-testid={`home-template-view-${template.id}`} href={`/templates/${template.id}`}>
                    View
                </Link>
            </Button>
        </li>
    );
}
