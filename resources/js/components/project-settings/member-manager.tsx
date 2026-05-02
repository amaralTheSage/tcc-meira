import UserSearchPicker from '@/components/user-search-picker';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SharedData, User } from '@/types';
import type { Project, ProjectInvitation } from '@/types/models';
import { router, usePage } from '@inertiajs/react';
import { Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { toast } from 'sonner';

export default function ProjectMemberManager({ project }: { project: Project }) {
    const authUser = usePage<SharedData>().props.auth.user;
    const [members, setMembers] = useState<User[]>(safeUsers(project.members));
    const [invitations, setInvitations] = useState<ProjectInvitation[]>(safeInvitations(project.invitations));
    const [removingMember, setRemovingMember] = useState<User | null>(null);
    const pendingInviteeIds = useMemo(() => new Set(invitations.map((invitation) => invitation.invitee_id)), [invitations]);

    function inviteUser(user: User): void {
        router.post(route('project-members.invite', { project: project.id }), { user_id: user.id }, inviteOptions(user, setInvitations));
    }

    function removeMember(): void {
        if (!removingMember) {
            return;
        }

        router.delete(route('project-members.destroy', { project: project.id, user: removingMember.id }), removeOptions(removingMember, setMembers, setRemovingMember));
    }

    return (
        <div className="space-y-5" data-testid="project-member-manager">
            <MemberListSection members={members} authUserId={authUser.id} onRemove={setRemovingMember} />
            <PendingInvitations invitations={invitations} />
            <section className="space-y-2">
                <h3 className="text-sm font-medium">Invite members</h3>
                <UserSearchPicker
                    endpoint={route('project-members.search', { project: project.id })}
                    emptyMessage="No eligible users found."
                    renderAction={(user) => (
                        <Button
                            disabled={pendingInviteeIds.has(user.id)}
                            onClick={() => inviteUser(user)}
                            size="sm"
                            type="button"
                            variant={pendingInviteeIds.has(user.id) ? 'secondary' : 'outline'}
                        >
                            <UserPlus className="size-4" />
                            {pendingInviteeIds.has(user.id) ? 'Pending' : 'Invite'}
                        </Button>
                    )}
                />
            </section>
            <RemoveMemberDialog member={removingMember} onOpenChange={setRemovingMember} onConfirm={removeMember} />
        </div>
    );
}

function MemberListSection({ members, authUserId, onRemove }: { members: User[]; authUserId: number; onRemove: (user: User) => void }) {
    return (
        <section className="space-y-2">
            <h3 className="text-sm font-medium">Current members</h3>
            <div className="space-y-2 rounded-md border border-border bg-background p-2">
                {members.map((member) => (
                    <MemberRow key={member.id} member={member}>
                        <MemberAction authUserId={authUserId} member={member} memberCount={members.length} onRemove={onRemove} />
                    </MemberRow>
                ))}
            </div>
        </section>
    );
}

function MemberAction({ authUserId, member, memberCount, onRemove }: { authUserId: number; member: User; memberCount: number; onRemove: (user: User) => void }) {
    if (member.id === authUserId) {
        return <Badge variant="secondary">You</Badge>;
    }

    return (
        <Button disabled={memberCount <= 1} onClick={() => onRemove(member)} size="icon-sm" type="button" variant="ghost" aria-label={`Remove ${member.name}`}>
            <Trash2 className="size-4" />
        </Button>
    );
}

function PendingInvitations({ invitations }: { invitations: ProjectInvitation[] }) {
    if (invitations.length === 0) {
        return null;
    }

    return (
        <section className="space-y-2">
            <h3 className="text-sm font-medium">Pending invitations</h3>
            <div className="space-y-2 rounded-md border border-border bg-background p-2">
                {invitations.map((invitation) => (
                    <MemberRow key={invitation.id} member={invitation.invitee}>
                        <Badge variant="outline">Pending invite</Badge>
                    </MemberRow>
                ))}
            </div>
        </section>
    );
}

function MemberRow({ member, children }: { member?: User; children: ReactNode }) {
    if (! member) {
        return null;
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
            <UserIdentity user={member} />
            <div className="shrink-0">{children}</div>
        </div>
    );
}

function UserIdentity({ user }: { user: User }) {
    return (
        <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-9">
                <AvatarImage src={user.avatar} alt="" />
                <AvatarFallback>{userInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
        </div>
    );
}

function RemoveMemberDialog({
    member,
    onConfirm,
    onOpenChange,
}: {
    member: User | null;
    onConfirm: () => void;
    onOpenChange: (member: User | null) => void;
}) {
    return (
        <AlertDialog open={Boolean(member)} onOpenChange={(open) => onOpenChange(open ? member : null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove project member?</AlertDialogTitle>
                    <AlertDialogDescription>{member?.name} will lose access and be removed from task assignments in this project.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onConfirm}>
                        Remove
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function inviteOptions(user: User, setInvitations: Dispatch<SetStateAction<ProjectInvitation[]>>) {
    return {
        preserveScroll: true,
        onError: () => toast.error('Unable to invite this user.'),
        onSuccess: () => {
            setInvitations((current) => addPendingInvitation(current, user));
            toast.success('Project invitation sent.');
        },
    };
}

function removeOptions(member: User, setMembers: Dispatch<SetStateAction<User[]>>, setRemovingMember: (member: User | null) => void) {
    return {
        preserveScroll: true,
        onError: () => toast.error('Unable to remove this member.'),
        onSuccess: () => {
            setMembers((current) => current.filter((currentMember) => currentMember.id !== member.id));
            setRemovingMember(null);
            toast.success('Project member removed.');
        },
    };
}

function addPendingInvitation(invitations: ProjectInvitation[], user: User): ProjectInvitation[] {
    if (invitations.some((invitation) => invitation.invitee_id === user.id)) {
        return invitations;
    }

    return [...invitations, pendingInvitation(user)];
}

function pendingInvitation(user: User): ProjectInvitation {
    return {
        id: Date.now(),
        invitee: user,
        invitee_id: user.id,
        inviter_id: 0,
        project_id: '',
        status: 'pending',
    };
}

function safeUsers(users?: User[]): User[] {
    return Array.isArray(users) ? users : [];
}

function safeInvitations(invitations?: ProjectInvitation[]): ProjectInvitation[] {
    return Array.isArray(invitations) ? invitations : [];
}

function userInitials(name: string): string {
    const initials = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2);

    return initials || '?';
}
