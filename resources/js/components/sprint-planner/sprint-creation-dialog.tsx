import { useForm } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SPRINT_COLOR_PALETTE, firstUnusedSprintColor, normalizeSprintHexColor, sprintAccentStyle } from '@/lib/sprint-colors';
import { cn } from '@/lib/utils';
import { Sprint } from '@/types/models';

interface SprintCreationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
    project_id: number | string;
    sprint?: Sprint;
    sprints?: Sprint[];
}

export default function SprintCreationDialog({ open, onOpenChange, onSubmit, project_id, sprint, sprints = [] }: SprintCreationDialogProps) {
    const createSprintColor = useMemo(() => firstUnusedSprintColor(sprints.map((projectSprint) => projectSprint.color)), [sprints]);
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        title: sprint?.title || '',
        start_at: sprint ? new Date(sprint.start_at) : new Date(),
        end_at: sprint ? new Date(sprint.end_at) : addDays(new Date(), 14),
        color: normalizeSprintHexColor(sprint?.color ?? createSprintColor),
    });

    useEffect(() => {
        if (!open) return;

        const startAt = sprint ? new Date(sprint.start_at) : new Date();
        const endAt = sprint ? new Date(sprint.end_at) : addDays(new Date(), 14);

        setData({
            title: sprint?.title || '',
            start_at: startAt,
            end_at: endAt,
            color: normalizeSprintHexColor(sprint?.color ?? createSprintColor),
        });
        setDate({ from: startAt, to: endAt });
    }, [createSprintColor, open, setData, sprint]);

    const [date, setDate] = useState<DateRange | undefined>({
        from: data.start_at,
        to: data.end_at,
    });

    useEffect(() => {
        if (date?.from) {
            setData('start_at', date.from);
        }
        if (date?.to) {
            setData('end_at', date.to);
        }
    }, [date, setData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sprint) {
            patch(route('sprint.update', { project: project_id, sprint: sprint.id }), {
                onSuccess: () => {
                    onSubmit();
                },
            });
        } else {
            post(route('sprint.store', { project: project_id }), {
                onSuccess: () => {
                    onSubmit();
                    reset();
                    setDate({ from: new Date(), to: addDays(new Date(), 14) });
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{sprint ? 'Edit sprint' : 'Create sprint'}</DialogTitle>
                    <DialogDescription>
                        {sprint ? 'Update your sprint details.' : 'Set your sprint cadence. Typical sprints are 2 weeks.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit}>
                    <div className="grid gap-4 py-4">
                        {/* Sprint Name Group */}
                        <div className="grid gap-2">
                            <Label htmlFor="title">Sprint Name</Label>
                            <Input
                                data-testid="sprint-title-input"
                                id="title"
                                placeholder="Sprint 24"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                            />
                            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                        </div>

                        {/* Date Picker Group */}
                        <div className="grid gap-2">
                            <Label>Duration</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={'outline'}
                                        className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                                                </>
                                            ) : (
                                                format(date.from, 'LLL dd, y')
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                                </PopoverContent>
                            </Popover>
                            {(errors.start_at || errors.end_at) && <p className="text-sm text-red-500">Both start and end dates are required.</p>}
                        </div>

                        <SprintColorField color={data.color} error={errors.color} onColorChange={(color) => setData('color', color)} />
                    </div>

                    <DialogFooter>
                        <Button data-testid="sprint-submit" type="submit" variant="destructive" disabled={processing}>
                            {sprint ? 'Update Sprint' : 'Create Sprint'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SprintColorField({
    color,
    error,
    onColorChange,
}: {
    color: string;
    error?: string;
    onColorChange: (color: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor="sprint-color">Sprint color</Label>
            <SprintColorSwatches color={color} onColorChange={onColorChange} />
            <SprintColorInput color={color} onColorChange={onColorChange} />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

function SprintColorSwatches({ color, onColorChange }: { color: string; onColorChange: (color: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {SPRINT_COLOR_PALETTE.map((paletteColor) => (
                <SprintColorSwatch key={paletteColor} color={color} onColorChange={onColorChange} paletteColor={paletteColor} />
            ))}
        </div>
    );
}

function SprintColorSwatch({
    color,
    onColorChange,
    paletteColor,
}: {
    color: string;
    onColorChange: (color: string) => void;
    paletteColor: string;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Use sprint color ${paletteColor}`}
            data-testid={`sprint-color-option-${paletteColor}`}
            className={cn('size-8 rounded-full border-2 p-0', normalizeSprintHexColor(color) === paletteColor && 'ring-2 ring-ring')}
            onClick={() => onColorChange(paletteColor)}
        >
            <span className="size-5 rounded-full" style={sprintAccentStyle(paletteColor)} />
        </Button>
    );
}

function SprintColorInput({ color, onColorChange }: { color: string; onColorChange: (color: string) => void }) {
    return (
        <Input
            data-testid="sprint-color-input"
            id="sprint-color"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
            onBlur={(event) => onColorChange(normalizeSprintHexColor(event.target.value))}
            className="font-mono"
            placeholder="#2563eb"
        />
    );
}
