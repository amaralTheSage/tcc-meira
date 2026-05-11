import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useInitials } from '@/hooks/use-initials';
import { CommunityPost } from '@/types/models';
import { Link } from '@inertiajs/react';
import { Download, Eye, LinkIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ProjectImageCarousel } from './project-image-carousel';

export default function ProjectDialog({ post, children }: { post: CommunityPost; children: ReactNode }) {
    const getInitials = useInitials();

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="grid w-7xl grid-cols-1 gap-6 p-8 sm:max-w-7xl lg:grid-cols-6">
                <div className="space-y-5 lg:col-span-4">
                    <ProjectImageCarousel images={post.images ?? []} members={post.members} preview={post.preview} title={post.title} />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <DialogTitle className="font-cardo text-4xl font-light italic md:text-5xl">{post.title}</DialogTitle>
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                            <Eye className="h-4 w-4" />
                            {post.public_views_count ?? 0}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-7 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                                {post.members.map((member) => (
                                    <Avatar key={member.id} className="aspect-square h-12 w-12 text-lg">
                                        <AvatarImage src={member.avatar ?? undefined} alt={member.name} className="object-cover" />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                ))}
                            </div>
                            {post.members.length > 0 && <span className="w-[150px] text-lg text-wrap">{memberSummary(post.members)}</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            {post.share_url && (
                                <Button variant="outline" size="lg" asChild>
                                    <a href={`${post.share_url}/export`}>
                                        <Download className="h-4 w-4" />
                                        Export
                                    </a>
                                </Button>
                            )}
                            {post.share_url && (
                                <Button variant="secondary" size="lg" asChild>
                                    <Link href={post.share_url}>
                                        <LinkIcon className="h-4 w-4" />
                                        Access
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
                <p className="font-cardo text-sm font-thin whitespace-pre-line lg:col-span-2">{post.description}</p>
            </DialogContent>
        </Dialog>
    );
}

function memberSummary(members: CommunityPost['members']): string {
    if (members.length === 1) {
        return members[0].name;
    }

    return `${members[0].name.split(' ')[0]} and ${members.length - 1} others`;
}
