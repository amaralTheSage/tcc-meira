import FeedPostCard from './feed-post-card';
import { CommunityPost } from '@/types/models';

export default function ProfilePostCard({ post, featured }: { post: CommunityPost; featured: boolean }) {
    return <FeedPostCard post={post} featured={featured} />;
}
