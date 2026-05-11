import FeedPostCard from '@/components/community/feed-post-card';
import AppLayoutTemplate from '@/layouts/app/app-header-layout';
import { capitalizeFirstLetter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { CommunityPost } from '@/types/models';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Feed',
        href: route('community.feed'),
    },
];

export default function Feed({ posts, collaboratorPosts = [] }: { posts: CommunityPost[]; collaboratorPosts?: CommunityPost[] }) {
    const [section, setSection] = useState<CommunityFeedSection>('everyone');
    const visiblePosts = section === 'everyone' ? posts : collaboratorPosts;

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            <Head title="Community" />

            <ul className="col-span-3 mt-24 mb-8 space-y-6 px-4">
                <h2 className="font-cardo text-4xl font-medium">{sectionLabel(section)}</h2>

                <div className="flex gap-4 text-muted-foreground underline-offset-4">
                    <li
                        onClick={() => setSection('everyone')}
                        className={` ${section === 'everyone' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                    >
                        Everyone
                    </li>

                    <li
                        onClick={() => setSection('collaborators')}
                        className={` ${section === 'collaborators' ? 'text-white' : 'hover:cursor-pointer hover:text-gray-200 hover:underline'}`}
                    >
                        Network
                    </li>
                </div>
            </ul>

            <ul className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 xl:grid-cols-4">
                {visiblePosts.map((post, index) => (
                    <FeedPostCard key={post.id ?? post.project_id ?? post.title} post={post} featured={index % 5 === 0} />
                ))}
            </ul>

            {visiblePosts.length === 0 && <p className="px-4 text-sm text-muted-foreground">{emptyFeedText(section)}</p>}

            <Toaster />
        </AppLayoutTemplate>
    );
}

type CommunityFeedSection = 'everyone' | 'collaborators';

function sectionLabel(section: CommunityFeedSection): string {
    if (section === 'collaborators') {
        return 'Network';
    }

    return capitalizeFirstLetter(section);
}

function emptyFeedText(section: CommunityFeedSection): string {
    if (section === 'collaborators') {
        return "No public projects from people you've worked with yet.";
    }

    return 'No public projects to show.';
}
