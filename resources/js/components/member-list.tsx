import { User } from '@/types';
import { Search } from 'lucide-react';
import { SetStateAction } from 'react';
import MemberListCard from './home/member-list-card';
import { ScrollArea } from './ui/scroll-area';

export default function MemberList({ users, setSelectedUsers }: { users: User[]; setSelectedUsers: React.Dispatch<SetStateAction<string[]>> }) {
    return (
        <ScrollArea className="h-80 rounded-md border p-1.5 pr-3" type="always">
            <div className="mb-1.5 flex w-full items-start gap-2 rounded-md border-2 px-2 pt-1 pb-0.5">
                <Search size={22} className="text-muted-foreground" />
                <input type="text" placeholder="Find collaborators..." className="w-full font-thin outline-0" />
            </div>
            {users ? (
                users.map((user) => {
                    return <MemberListCard member={user} key={user.id} setSelectedUsers={setSelectedUsers} />;
                })
            ) : (
                <p className="text-center text-sm ">Search for your teammates!</p>
            )}
        </ScrollArea>
    );
}
