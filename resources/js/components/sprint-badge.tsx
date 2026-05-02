import { normalizeSprintHexColor, sprintTintStyle } from '@/lib/sprint-colors';
import { cn } from '@/lib/utils';
import type { Sprint } from '@/types/models';
import { CalendarDays } from 'lucide-react';
import type { CSSProperties, MouseEventHandler, ReactElement } from 'react';

const SPRINT_BADGE_CLASS_NAME =
    'inline-flex max-w-44 min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] leading-none text-foreground/90 shadow-sm backdrop-blur-sm';

interface SprintBadgeProps {
    ariaLabel?: string;
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    sprint: Sprint;
}

/**
 * Render sprint metadata with the shared quiet tinted badge treatment.
 *
 * Example: <SprintBadge sprint={sprint} ariaLabel={`Open sprint ${sprint.title}`} />.
 */
export function SprintBadge({ ariaLabel, className, onClick, sprint }: SprintBadgeProps): ReactElement {
    const label = ariaLabel ?? `Sprint ${sprint.title}`;
    const badgeClassName = cn(SPRINT_BADGE_CLASS_NAME, onClick && 'transition-opacity hover:opacity-85', className);

    if (onClick) {
        return (
            <button
                type="button"
                aria-label={label}
                title={`Sprint: ${sprint.title}`}
                className={badgeClassName}
                style={sprintBadgeFrameStyle(sprint)}
                onClick={onClick}
            >
                <SprintBadgeContent sprint={sprint} />
            </button>
        );
    }

    return (
        <span aria-label={label} title={`Sprint: ${sprint.title}`} className={badgeClassName} style={sprintBadgeFrameStyle(sprint)}>
            <SprintBadgeContent sprint={sprint} />
        </span>
    );
}

function SprintBadgeContent({ sprint }: { sprint: Sprint }): ReactElement {
    const iconStyle = { color: normalizeSprintHexColor(sprint.color) };

    return (
        <>
            <CalendarDays aria-hidden="true" className="size-3 shrink-0 opacity-80" style={iconStyle} />
            <span className="truncate font-medium">{sprint.title}</span>
        </>
    );
}

function sprintBadgeFrameStyle(sprint: Sprint): CSSProperties {
    const tintStyle = sprintTintStyle(sprint.color);

    return {
        backgroundColor: tintStyle.backgroundColor,
        borderColor: tintStyle.borderColor,
    };
}
