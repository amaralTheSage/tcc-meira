import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export interface FeedPostInterface {
    img: string;
    title: string;
    description: string;
    size: 'L' | 'S';
}

const members = [
    { id: 1, avatar: null, name: 'Marce1in Passa Piça' },
    { id: 2, avatar: null, name: 'Marce1in Passa Piça' },
    { id: 3, avatar: null, name: 'Marce1in Passa Piça' },
    { id: 4, avatar: null, name: 'Marce1in Passa Piça' },
];

export default function FeedPostCard({ post }: { post: FeedPostInterface }) {
    const getInitials = useInitials();

    return (
        <li className={`flex flex-col overflow-hidden rounded-xl bg-neutral-900 shadow-lg ${post.size === 'L' && 'col-span-2'}`}>
            <div className="h-48 w-full overflow-hidden">
                <img src={post.img} alt={post.title} className="h-full w-full object-cover" />
            </div>

            {/* Content */}
            <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-cardo text-3xl text-nowrap text-white italic">{post.title}</h2>

                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-5 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
                            {members &&
                                members.map((member: any) => (
                                    <div className="flex w-fit">
                                        <Avatar key={member.id}>
                                            <AvatarImage src={member.avatar} alt={member.name} className="object-cover" />
                                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                ))}
                        </div>
                        {post.size === 'L' && (
                            <span className="max-w-[175px] text-sm max-md:hidden">
                                {members[0].name.split(' ')[0]} and {members.length - 1} others
                            </span>
                        )}
                    </div>
                </div>

                {post.size === 'S' && (
                    <p className="font-cardo text-md text-neutral-400">
                        {post.description.length > 93 ? post.description.slice(0, 93) + '... ' : post.description}
                        <button className="text-sm text-white underline">read more</button>
                    </p>
                )}

                {post.size === 'L' && (
                    <p className="font-cardo text-md text-neutral-400">
                        {post.description.length > 245 ? post.description.slice(0, 245) + '... ' : post.description}
                        <button className="text-sm text-white underline">read more</button>
                    </p>
                )}
            </div>
        </li>
    );
}
