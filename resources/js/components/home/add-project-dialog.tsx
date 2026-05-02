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
import UserSearchPicker from '@/components/user-search-picker';
import { User } from '@/types';
import { useForm } from '@inertiajs/react';
import { ReactNode, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

interface ProjectForm extends Record<string, string | number[]> {
    title: string;
    selectedUsers: number[];
}

export function AddProjectDialog({
    children,
    users,
}: {
    children: ReactNode;
    users: User[];
}) {
    const { data, post, reset, setData } = useForm<ProjectForm>({ title: '', selectedUsers: [] });
    const [open, setOpen] = useState(false);

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(route('projects.store'), {
            preserveState: false,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
            onError: () => {
                toast.error('An error occurred when creating the project.');
            },
        });
    }

    function toggleUser(userId: number): void {
        const selectedUsers = data.selectedUsers.includes(userId)
            ? data.selectedUsers.filter((selectedUserId) => selectedUserId !== userId)
            : [...data.selectedUsers, userId];

        setData('selectedUsers', selectedUsers);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form data-testid="project-create-form" onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                        <DialogDescription>More options are available on the project settings page.</DialogDescription>
                    </DialogHeader>
                    <div className="grid w-full gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="title">Project Title</Label>
                            <Input
                                data-testid="project-title-input"
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
                            <UserSearchPicker
                                endpoint={route('users.search')}
                                initialUsers={users}
                                renderAction={(user) => (
                                    <Button
                                        size="sm"
                                        type="button"
                                        variant={data.selectedUsers.includes(user.id) ? 'secondary' : 'outline'}
                                        onClick={() => toggleUser(user.id)}
                                    >
                                        {data.selectedUsers.includes(user.id) ? 'Selected' : 'Add'}
                                    </Button>
                                )}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button data-testid="project-create-submit" type="submit">
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
