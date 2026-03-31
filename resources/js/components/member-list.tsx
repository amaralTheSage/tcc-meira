import { User } from '@/types';
import { router } from '@inertiajs/react';
import debounce from 'lodash.debounce';
import { Search } from 'lucide-react';
import { SetStateAction, useCallback, useState } from 'react';
import MemberListCard from './home/member-list-card';
import { ScrollArea } from './ui/scroll-area';

export default function MemberList({
    users,
    setSelectedUsers,
    searchedUsers,
}: {
    users: User[];
    setSelectedUsers: React.Dispatch<SetStateAction<number[]>>;
    searchedUsers?: User[];
}) {
    const [query, setQuery] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const runSearch = useCallback(
        debounce((value: string) => {
            router.get(
                '/search-users',
                { search: value },
                {
                    preserveState: true,
                    replace: true,
                    only: ['users'], // partial reload
                },
            );
        }, 300),
        [],
    );

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        runSearch(value);
    };

    return (
        <ScrollArea className="h-80 rounded-md border p-1.5 pr-3" type="always">
            <div className="mb-1.5 flex w-full items-start gap-2 rounded-md border-2 px-2 pt-1 pb-0.5">
                <Search size={22} className="text-muted-foreground" />
                <input type="text" placeholder="Search by name or email" value={query} onChange={onChange} className="w-full font-thin outline-0" />
            </div>
            {searchedUsers &&
                searchedUsers.map((user) => {
                    return <MemberListCard member={user} key={user.id} setSelectedUsers={setSelectedUsers} />;
                })}

            {!searchedUsers && users.length > 0 ? (
                users.map((user) => {
                    return <MemberListCard member={user} key={user.id} setSelectedUsers={setSelectedUsers} />;
                })
            ) : (
                <p className="mt-6 text-center text-sm">Search for your teammates!</p>
            )}
        </ScrollArea>
    );
}
