import { User } from '@/types';
import UserTemplate from './user-template';

export default function UserTemplateList({ user }: { user: User }) {
    const templates = user.templates ?? [];

    return (
        <div className="col-span-3 w-full">
            {templates.length > 0 ? (
                templates.map((template) => {
                    return <UserTemplate template={template} key={template.id} user={user} />;
                })
            ) : (
                <p className="mt-6 text-center text-sm">Search for templates</p>
            )}
        </div>
    );
}
