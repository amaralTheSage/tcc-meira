import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

interface UserSearchPickerProps {
    endpoint: string;
    renderAction: (user: User) => ReactNode;
    className?: string;
    emptyMessage?: string;
    initialUsers?: User[];
    placeholder?: string;
    searchDelayMs?: number;
}

const EMPTY_USERS: User[] = [];

export default function UserSearchPicker({
    endpoint,
    renderAction,
    className,
    emptyMessage = 'No users found.',
    initialUsers = EMPTY_USERS,
    placeholder = 'Search by name or email',
    searchDelayMs = 200,
}: UserSearchPickerProps) {
    const stableInitialUsers = useMemo(() => safeUsers(initialUsers), [initialUsers]);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>(stableInitialUsers);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (query.trim() === '') {
            setResults(stableInitialUsers);
        }
    }, [query, stableInitialUsers]);

    useEffect(() => {
        return searchUsers(endpoint, query, searchDelayMs, setResults, setIsSearching);
    }, [endpoint, query, searchDelayMs]);

    return (
        <div className={cn('rounded-md border border-border bg-background', className)}>
            <div className="relative border-b border-border">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder} className="border-0 pl-9 shadow-none" />
                {isSearching && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            </div>
            <div className="h-60 overflow-y-auto">
                <div data-testid="user-search-results" className="space-y-2 p-2">
                    {results.map((user) => (
                        <UserSearchRow key={user.id} user={user} action={renderAction(user)} />
                    ))}
                    {results.length === 0 && <p className="px-2 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>}
                </div>
            </div>
        </div>
    );
}

function searchUsers(
    endpoint: string,
    query: string,
    searchDelayMs: number,
    setResults: (users: User[]) => void,
    setIsSearching: (isSearching: boolean) => void,
): () => void {
    const trimmedQuery = query.trim();

    if (trimmedQuery === '') {
        return () => undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
        void fetchUsers(endpoint, trimmedQuery, controller.signal, setResults, setIsSearching);
    }, searchDelayMs);

    return () => {
        controller.abort();
        window.clearTimeout(timeout);
    };
}

async function fetchUsers(
    endpoint: string,
    query: string,
    signal: AbortSignal,
    setResults: (users: User[]) => void,
    setIsSearching: (isSearching: boolean) => void,
): Promise<void> {
    setIsSearching(true);

    try {
        const response = await fetch(searchUrl(endpoint, query), { headers: { Accept: 'application/json' }, signal });
        const users = await response.json();
        setResults(safeUsers(users));
    } catch {
        if (! signal.aborted) {
            setResults([]);
        }
    } finally {
        if (! signal.aborted) {
            setIsSearching(false);
        }
    }
}

function UserSearchRow({ user, action }: { user: User; action: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9">
                    <AvatarImage src={user.avatar} alt="" />
                    <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <CollaborationBadge user={user} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}

function CollaborationBadge({ user }: { user: User }) {
    if (! user.has_collaborated) {
        return null;
    }

    return (
        <Badge variant="secondary" className="max-w-36 truncate">
            {collaborationLabel(user.shared_projects_count ?? 0)}
        </Badge>
    );
}

function collaborationLabel(sharedProjectsCount: number): string {
    if (sharedProjectsCount <= 1) {
        return 'Worked together';
    }

    return `Worked together ${sharedProjectsCount}x`;
}

function searchUrl(endpoint: string, query: string): string {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set('search', query);

    return url.toString();
}

function safeUsers(value: unknown): User[] {
    return Array.isArray(value) ? value : [];
}

function userInitials(name: string): string {
    const initials = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);

    return initials || '?';
}
