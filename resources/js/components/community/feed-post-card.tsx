import { useInitials } from '@/hooks/use-initials';
import { CommunityPost } from '@/types/models';
import { Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import CommunityProjectPreview from './community-project-preview';
import ProjectDialog from './project-dialog';

export default function FeedPostCard({ post, featured = false }: { post: CommunityPost; featured?: boolean }) {
    const getInitials = useInitials();
    const imageUrl = post.images?.[0]?.url;
    const visibleMembers = post.members.slice(0, 4);

    return (
        <ProjectDialog post={post}>
            <li className={`flex cursor-pointer flex-col overflow-hidden rounded-md bg-neutral-900 shadow-lg ${featured ? 'xl:col-span-2' : ''}`}>
                <div className="h-48 w-full overflow-hidden">
                    {imageUrl ? (
                        <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                        <CommunityProjectPreview members={post.members} preview={post.preview} />
                    )}
                </div>

                <div className="flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <h2 className="font-cardo min-w-0 truncate text-3xl text-white italic">{post.title}</h2>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3.5 w-3.5" />
                            {post.public_views_count ?? 0}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                            {visibleMembers.map((member) => (
                                <Avatar key={member.id}>
                                    <AvatarImage src={member.avatar ?? undefined} alt={member.name} className="object-cover" />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        {post.members.length > 0 && <span className="truncate text-sm text-muted-foreground">{memberSummary(post.members)}</span>}
                    </div>

                    <p className="font-cardo line-clamp-3 text-sm text-neutral-400">{post.description}</p>
                </div>
            </li>
        </ProjectDialog>
    );
}

function memberSummary(members: CommunityPost['members']): string {
    if (members.length === 1) {
        return members[0].name;
    }

    return `${members[0].name.split(' ')[0]} and ${members.length - 1} others`;
}
