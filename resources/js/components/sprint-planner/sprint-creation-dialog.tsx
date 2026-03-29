import { useForm } from '@inertiajs/react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Sprint } from '@/types/models';

interface SprintCreationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: () => void;
    project_id: number | string;
    sprint?: Sprint;
}

export default function SprintCreationDialog({ open, onOpenChange, onSubmit, project_id, sprint }: SprintCreationDialogProps) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        title: sprint?.title || '',
        start_at: sprint ? new Date(sprint.start_at) : new Date(),
        end_at: sprint ? new Date(sprint.end_at) : addDays(new Date(), 14),
    });

    useEffect(() => {
        if (sprint) {
            setData({
                title: sprint.title,
                start_at: new Date(sprint.start_at),
                end_at: new Date(sprint.end_at),
            });
            setDate({
                from: new Date(sprint.start_at),
                to: new Date(sprint.end_at),
            });
        }
    }, [sprint]);

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
    }, [date]);

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
                            <Input id="title" placeholder="Sprint 24" value={data.title} onChange={(e) => setData('title', e.target.value)} />
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
                    </div>

                    <DialogFooter>
                        <Button type="submit" variant="destructive" disabled={processing}>
                            {sprint ? 'Update Sprint' : 'Create Sprint'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
