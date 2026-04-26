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
import { User } from '@/types';
import { useForm } from '@inertiajs/react';
import { ReactNode, useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import MemberList from '../member-list';

// TODO: change it so the list shows friends, and other users show up on search
interface ProjectForm extends Record<string, string | number[]> {
    title: string;
    selectedUsers: number[];
}

export function AddProjectDialog({
    children,
    users,
    searchedUsers,
}: {
    children: ReactNode;
    users: User[];
    searchedUsers: User[];
    previousColaborators?: User[];
}) {
    const { post, setData } = useForm<ProjectForm>({ title: '', selectedUsers: [] });
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    useEffect(() => {
        setData('selectedUsers', selectedUsers);
    }, [selectedUsers, setData]);

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(route('projects.store'), {
            preserveScroll: true,
            onError: () => {
                toast.error('An error occurred when creating the project.');
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
                    <div className="grid w-full gap-4">
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
                            <MemberList users={users} setSelectedUsers={setSelectedUsers} searchedUsers={searchedUsers} />
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
