import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { CommunityPost } from '@/types/models';
import { Link } from 'lucide-react';
import { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ProjectImageCarousel } from './project-image-carousel';

export default function ProjectDialog({ title, images, description, members, children }: CommunityPost & { children: ReactNode }) {
    const getInitials = useInitials();

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="grid w-7xl grid-cols-6 gap-6 p-8 sm:max-w-7xl">
                <div className="col-span-4 space-y-5">
                    {/* Carrossel */}
                    <ProjectImageCarousel />

                    <div className="flex items-center justify-between">
                        <DialogTitle className="font-cardo text-5xl font-light italic">{title}</DialogTitle>
                        <span className="font-cardo text-lg font-thin text-gray-400">10.08.2025</span>
                    </div>

                    <div className="mt-8 flex items-end justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-7 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                                {members &&
                                    members.map((member: User) => (
                                        <div className="flex w-fit">
                                            <Avatar key={member.id} className="aspect-square h-12 w-12 text-lg">
                                                <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    ))}
                            </div>

                            <span className="w-[150px] text-lg text-wrap">
                                {members[0].name.split(' ')[0]} and <span className="underline">{members.length - 1} others</span>
                            </span>
                        </div>

                        <Button variant={'secondary'} size={'lg'} className="flex text-base">
                            <Link />
                            Access
                        </Button>
                    </div>
                </div>
                <p className="font-cardo col-span-2 text-justify text-sm font-thin whitespace-pre-line">{description}</p>
            </DialogContent>
        </Dialog>
    );
}
