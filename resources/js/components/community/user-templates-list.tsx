import { User } from '@/types';
import UserTemplate from './user-template';

export default function UserTemplateList({ user }: { user: User }) {
    return (
        <div className="col-span-3 w-full">
            {user.templates?.length > 0 ? (
                user.templates?.map((template) => {
                    return <UserTemplate template={template} key={template.id} user={user} />;
                })
            ) : (
                <p className="mt-6 text-center text-sm">Search for templates</p>
            )}
        </div>
    );
}
