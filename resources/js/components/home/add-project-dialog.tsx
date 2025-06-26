import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { ReactNode } from 'react';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import MemberListCard from './member-list-card';

const members = [
    {
        id: '1',
        name: 'gabriel amaral',
        image: 'gabriel.png',
    },
    {
        id: '2',
        name: 'lorenzo war elf',
        image: 'lorenzo.png',
    },
    {
        id: '1234',
        name: 'gabriel amaral',
    },
    {
        id: '1524',
        name: 'lorenzo war elf',
    },
    {
        id: '1653',
        name: 'gabriel amaral',
        image: 'gabriel.png',
    },
    {
        id: '6351',
        name: 'lorenzo war elf',
    },
];

// TODO: change it so the list shows friends, and other users show up on search

export function AddProjectDialog({ children }: { children: ReactNode }) {
    const { post, setData, data } = useForm();

    function submit(e) {
        e.preventDefault();
        post(route('projects.store'), {
            preserveScroll: true,
            onError: (errors) => {
                toast.error('An error occurred when creating the project.');
                console.error(errors);
            },
        });
    }
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                        <DialogDescription>More options are available on the project settings page.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="My project"
                                required
                                maxLength={50}
                                onChange={(e) => {
                                    setData('title', e.target.value);
                                }}
                            />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="members">Add Members</Label>
                            <ScrollArea className="h-80 rounded-md border p-1.5 pr-3" type="always">
                                <div className="items-startz mb-1.5 flex w-full gap-2 rounded-md border-2 px-2 pt-1 pb-0.5">
                                    <Search size={22} className="text-muted-foreground" />
                                    <input type="text" placeholder="Find collaborators..." className="w-full font-thin outline-0" />
                                </div>
                                {members.map((member) => {
                                    return <MemberListCard member={member} key={member.id} />;
                                })}
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Create Project</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
