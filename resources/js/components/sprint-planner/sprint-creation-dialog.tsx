import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

export default function SprintCreationDialog() {
    const [name, setName] = useState('');
    const [date, setDate] = useState<DateRange | undefined>({
        from: new Date(),
        to: addDays(new Date(), 14),
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>New sprint</Button>
            </DialogTrigger>
            <DialogContent >
                <DialogHeader>
                    <DialogTitle>Create sprint</DialogTitle>
                    <DialogDescription>Set your sprint cadence. Typical sprints are 2 weeks.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Sprint Name Group */}
                    <div className="grid gap-2">
                        <Label htmlFor="name">Sprint Name</Label>
                        <Input id="name" placeholder="Sprint 24" value={name} onChange={(e) => setName(e.target.value)} />
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
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit">Create Sprint</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
