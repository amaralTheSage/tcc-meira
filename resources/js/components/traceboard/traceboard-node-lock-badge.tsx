import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TraceboardNodeTouchLock } from './traceboard-node-touch-locks';
import { traceboardUserAccentColor } from './traceboard-user-colors';

interface TraceboardNodeLockBadgeProps {
    isLocal?: boolean;
    lock?: TraceboardNodeTouchLock;
}

/**
 * Renders the remote user avatar that owns a Traceboard node touch lock.
 *
 * @example
 * <TraceboardNodeLockBadge lock={lock} />
 */
export function TraceboardNodeLockBadge({ isLocal = false, lock }: TraceboardNodeLockBadgeProps) {
    if (!lock || isLocal) {
        return null;
    }

    const lockColor = traceboardUserAccentColor(lock.user.id);

    return (
        <div
            aria-label={`${lock.user.name} is editing this item`}
            className="pointer-events-none absolute -top-3 -right-3 z-20 rounded-full bg-card p-0.5 shadow-md"
            data-testid={`traceboard-lock-avatar-${lock.nodeId}`}
        >
            <Avatar className="size-8 border-2" style={{ borderColor: lockColor }}>
                <AvatarImage src={lock.user.avatar ?? undefined} alt={lock.user.name} className="object-cover" />
                <AvatarFallback className="text-xs text-white" style={{ backgroundColor: lockColor }}>
                    {traceboardLockInitials(lock.user.name)}
                </AvatarFallback>
            </Avatar>
        </div>
    );
}

function traceboardLockInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}
