import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sprintAccentStyle } from '@/lib/sprint-colors';
import { formatDate } from '@/lib/utils';
import { Column, Project, Tag } from '@/types/models';
import type { Dispatch, JSX, SetStateAction } from 'react';

const EMPTY_FILTER_VALUES = {
    date: 'all-dates',
    member: 'all-members',
    sprint: 'all-sprints',
    tag: 'all-tags',
} as const;

type KanbanFilterState = { member: string; tag: string; date: string; sprint: string };
type KanbanFilterKey = keyof KanbanFilterState;
type KanbanFilterOption = { color?: string; label: string; value: string };

type KanbanFilterProps = {
    columns: Column[];
    filters: KanbanFilterState;
    project: Project;
    setFilters: Dispatch<SetStateAction<KanbanFilterState>>;
};

type KanbanFilterSelectConfig = {
    emptyValue: string;
    filterKey: KanbanFilterKey;
    label: string;
    options: KanbanFilterOption[];
    testId: string;
};

export default function KanbanFilter({ columns, filters, setFilters, project }: KanbanFilterProps): JSX.Element {
    const filterSelects = getKanbanFilterSelects(columns, project);
    const handleClear = (): void => setFilters({ member: '', tag: '', date: '', sprint: '' });
    const handleFilterChange = (key: KanbanFilterKey, emptyValue: string, value: string): void =>
        setFilters((currentFilters) => ({ ...currentFilters, [key]: value === emptyValue ? '' : value }));

    return (
        <div className="flex min-w-0 flex-col gap-2 md:items-end">
            <div className="flex max-w-full flex-wrap gap-2">
                {filterSelects.map((selectConfig) => (
                    <KanbanFilterSelect
                        key={selectConfig.filterKey}
                        {...selectConfig}
                        value={filters[selectConfig.filterKey] || selectConfig.emptyValue}
                        onValueChange={(value) => handleFilterChange(selectConfig.filterKey, selectConfig.emptyValue, value)}
                    />
                ))}
                <button
                    data-testid="kanban-filter-clear"
                    className="h-9 rounded-md border border-border/70 bg-sidebar/50 px-3 text-sm text-muted-foreground transition-colors hover:border-red-800/70 hover:text-foreground"
                    onClick={handleClear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

function KanbanFilterSelect({
    emptyValue,
    label,
    onValueChange,
    options,
    testId,
    value,
}: KanbanFilterSelectConfig & { onValueChange: (value: string) => void; value: string }): JSX.Element {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger data-testid={testId} className="h-9 w-28 cursor-pointer border-border/70 bg-sidebar/50 text-foreground shadow-none">
                <SelectValue placeholder={label} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={emptyValue}>{label}</SelectItem>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.color && (
                            <span
                                aria-hidden
                                className="size-2 rounded-full"
                                data-testid={`kanban-filter-sprint-color-${option.value}`}
                                style={sprintAccentStyle(option.color)}
                            />
                        )}
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function getKanbanFilterSelects(columns: Column[], project: Project): KanbanFilterSelectConfig[] {
    return [
        {
            emptyValue: EMPTY_FILTER_VALUES.member,
            filterKey: 'member',
            label: 'Members',
            options: getMemberOptions(project),
            testId: 'kanban-filter-member',
        },
        { emptyValue: EMPTY_FILTER_VALUES.tag, filterKey: 'tag', label: 'Tags', options: getTagOptions(columns), testId: 'kanban-filter-tag' },
        { emptyValue: EMPTY_FILTER_VALUES.date, filterKey: 'date', label: 'Dates', options: getDateOptions(columns), testId: 'kanban-filter-date' },
        {
            emptyValue: EMPTY_FILTER_VALUES.sprint,
            filterKey: 'sprint',
            label: 'Sprints',
            options: getSprintOptions(project),
            testId: 'kanban-filter-sprint',
        },
    ];
}

function getMemberOptions(project: Project): KanbanFilterOption[] {
    return project.members.map((user) => ({ label: user.name, value: String(user.id) }));
}

function getSprintOptions(project: Project): KanbanFilterOption[] {
    return project.sprints?.map((sprint) => ({ color: sprint.color, label: sprint.title, value: sprint.id })) || [];
}

function getTagOptions(columns: Column[]): KanbanFilterOption[] {
    const uniqueTags = new Map<string, Tag>();
    columns.forEach((column) => column.tasks?.forEach((task) => task.tags?.forEach((tag) => uniqueTags.set(tag.id, tag))));

    return Array.from(uniqueTags.values()).map((tag) => ({ label: tag.name, value: tag.id }));
}

function getDateOptions(columns: Column[]): KanbanFilterOption[] {
    const createdDates = new Set<string>();
    columns.forEach((column) => column.tasks?.forEach((task) => createdDates.add(task.created_at)));

    return Array.from(createdDates).map((createdDate) => ({ label: formatDate(createdDate), value: createdDate }));
}
