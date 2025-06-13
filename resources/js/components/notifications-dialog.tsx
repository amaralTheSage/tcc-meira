import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';
import NotificationCard from './notification-card';

export function NotificationsDialog({ children }: { children?: React.ReactNode }) {
    const [tab, setTab] = useState<'Projects' | 'Community'>('Projects');

    return (
        <Popover>
            <PopoverTrigger>{children}</PopoverTrigger>
            <PopoverContent side="right" className="ml-7 h-[80vw] w-fit overflow-scroll bg-sidebar px-6 py-7">
                <h2 className="mb-2 text-xl">Notifications</h2>

                <div>
                    <button
                        className={`${tab === 'Projects' ? 'border-b-[1px] border-white' : 'text-gray-300'} mr-4`}
                        onClick={() => setTab('Projects')}
                    >
                        Projects
                    </button>
                    <button
                        className={`${tab === 'Community' ? 'border-b-[1px] border-white' : 'text-gray-300'}`}
                        onClick={() => setTab('Community')}
                    >
                        Community
                    </button>
                </div>

                <ul>
                    <NotificationCard />
                    <NotificationCard />
                    <NotificationCard />
                    <NotificationCard />
                </ul>
            </PopoverContent>
        </Popover>
    );
}
