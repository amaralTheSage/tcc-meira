import { FeedPostInterface } from './feed-post-card';
import ProfilePostCard from './profile-post-card';

export default function Gallery({ projects }: { projects: FeedPostInterface[] }) {
    // alterável pelo usuário
    const showsInfo = true;

    return (
        <>
            {projects.map((post) => {
                return <ProfilePostCard post={post} showsInfo={showsInfo} />;
            })}
        </>
    );
}
