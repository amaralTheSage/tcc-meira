import { CommunityPost } from '@/types/models';
import ProfilePostCard from './profile-post-card';

export default function Gallery({ projects }: { projects: CommunityPost[] }) {
    return (
        <>
            {projects.map((post, index) => (
                <ProfilePostCard key={post.id ?? post.project_id ?? post.title} post={post} featured={index % 3 === 0} />
            ))}
        </>
    );
}
