import Gallery from '@/components/community/gallery';
import UserTemplateList from '@/components/community/user-templates-list';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { capitalizeFirstLetter } from '@/lib/utils';
import { BreadcrumbItem, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Feed',
        href: route('community.feed'),
    },
];

export interface FeedPostInterface {
    img: string;
    title: string;
    description: string;
    size: 'L' | 'S';
}

export default function Profile({ user }: { user: User }) {
    const getInitials = useInitials();

    function randomLS() {
        return Math.random() < 0.5 ? 'L' : 'S';
    }

    const lOrS = randomLS();

    const posts: FeedPostInterface[] = user.posts?.map((p) => {
        return { ...p, size: lOrS };
    });

    const [section, setSection] = useState<'gallery' | 'templates'>('gallery');

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <ul className="grid grid-cols-4 gap-4 px-4">
                <div className="col-span-3 mt-24 mb-8 space-y-6">
                    <h2 className="font-cardo text-4xl font-medium">{capitalizeFirstLetter(section)}</h2>
                    <hr className="mt-3 border-[1.5px] border-muted-foreground" />

                    <div className="flex gap-4 text-muted-foreground underline-offset-4">
                        <li
                            onClick={() => setSection('gallery')}
                            className={` ${section === 'gallery' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                        >
                            Gallery
                        </li>

                        <li
                            onClick={() => setSection('templates')}
                            className={` ${section === 'templates' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                        >
                            Templates
                        </li>
                    </div>
                </div>

                <div className="row-span-2 flex flex-col items-center justify-center space-y-2">
                    <Avatar className="h-28 w-28 overflow-hidden rounded-full">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="rounded-lg bg-neutral-200 text-5xl text-black dark:bg-neutral-700 dark:text-white">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <h3 className="font-cardo mt-4 text-3xl font-semibold">{user.name}</h3>
                    <p>2 friends</p>

                    <Button variant={'secondary'} size={'lg'} className="mt-7 w-4/5">
                        <Plus />
                        Add Friend
                    </Button>
                </div>

                {section === 'gallery' ? <Gallery projects={posts} /> : <UserTemplateList user={user} />}
            </ul>

            <Toaster />
        </AppLayoutTemplate>
    );
}
