import { useInitials } from '@/hooks/use-initials';
import { User } from '@/types';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';

export default function MemberListCard({
    member,
    setSelectedUsers,
}: {
    member: User;
    setSelectedUsers: React.Dispatch<React.SetStateAction<string[]>>;
}) {
    const getInitials = useInitials();
    const [isSelected, setIsSelected] = useState(false);

    useEffect(() => {
        if (isSelected) {
            setSelectedUsers((selectedUsers) => [...selectedUsers, member.id]);
        } else {
            setSelectedUsers((selectedUsers) => selectedUsers.filter((curId) => curId !== member.id));
        }
    }, [isSelected]);

    return (
        <li className="mb-1.5 flex w-full items-center justify-between rounded-md border border-[#e3e3e0] bg-white p-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:hover:border-[#62605b]">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(member.name)}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <h3>{member.name}</h3>
                    <p className="text-muted-foreground">invite to the team</p>
                </div>
            </div>
            <Checkbox
                className="mr-2 size-5 border-muted-foreground"
                onCheckedChange={(checked: boolean) => {
                    setIsSelected(checked);
                }}
            />
        </li>
    );
}
