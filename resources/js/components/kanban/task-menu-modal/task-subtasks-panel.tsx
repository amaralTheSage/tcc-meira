import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { User } from '@/types';
import type { TaskSubtask } from '@/types/models';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface TaskSubtasksPanelProps {
    assignedSubtaskUsers: Record<string, string[]>;
    cancelCreatingSubtask: () => void;
    createSubtask: () => void;
    creatingSubtask: boolean;
    getInitials: (name: string) => string;
    members?: User[];
    newSubtaskTitle: string;
    onSubtaskCompletion: (subtaskId: string) => void;
    onSubtaskUserAssignment: (userId: string, subtaskId: string) => void;
    setNewSubtaskTitle: (title: string) => void;
    startCreatingSubtask: () => void;
    subtasks: TaskSubtask[];
}

/**
 * Displays subtask status, assignment controls, and inline creation.
 *
 * @example
 * <TaskSubtasksPanel subtasks={task.subtasks} members={project.members} />
 */
export default function TaskSubtasksPanel(props: TaskSubtasksPanelProps) {
    return (
        <aside className="flex max-h-[60vh] w-full flex-col gap-4 overflow-y-auto rounded-md border border-border/70 bg-sidebar/50 p-4 md:w-1/3">
            <h3 className="text-sm font-semibold text-foreground">Subtasks</h3>
            <SubtaskTable {...props} />
            {props.creatingSubtask && <NewSubtaskRow {...props} />}
            <button
                data-testid="kanban-add-subtask"
                className="mb-2 cursor-pointer rounded-md px-3 py-2 text-xs text-muted-foreground hover:bg-red-950/20 hover:text-foreground"
                onClick={props.startCreatingSubtask}
            >
                + Add subtask
            </button>
        </aside>
    );
}

function SubtaskTable(props: TaskSubtasksPanelProps) {
    if (!props.subtasks) return null;

    return (
        <div className="relative overflow-x-auto rounded-md border border-border/70 shadow-xs">
            <table className="text-body custom-scrollbar w-full overflow-x-hidden text-left text-sm rtl:text-right">
                <SubtaskTableHeader />
                <tbody>
                    {props.subtasks.map((subtask) => (
                        <SubtaskRow key={subtask.id} subtask={subtask} {...props} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SubtaskTableHeader() {
    return (
        <thead className="border-b border-border/70 bg-background text-sm">
            <tr className="text-muted-foreground">
                <th scope="col" className="px-6 py-3 font-medium"></th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Titulo
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Status
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                    Responsaveis
                </th>
            </tr>
        </thead>
    );
}

function SubtaskRow({ subtask, ...props }: TaskSubtasksPanelProps & { subtask: TaskSubtask }) {
    return (
        <tr className="cursor-pointer border-b border-border/70 bg-background/70 text-muted-foreground hover:bg-muted/60">
            <th scope="row" className="px-6 py-4">
                <Checkbox
                    checked={subtask.completed || false}
                    onCheckedChange={() => props.onSubtaskCompletion(subtask.id)}
                    className="cursor-pointer border-2 border-solid border-border"
                />
            </th>
            <th scope="row" className="text-heading px-6 py-4 font-medium whitespace-nowrap">
                {subtask.title}
            </th>
            <td className="px-6 py-4">{subtask.completed ? 'Completed' : 'Pending'}</td>
            <td className="px-6 py-4">
                <SubtaskAssigneePopover subtask={subtask} {...props} />
            </td>
        </tr>
    );
}

function SubtaskAssigneePopover({ subtask, ...props }: TaskSubtasksPanelProps & { subtask: TaskSubtask }) {
    return (
        <div className="flex flex-col rounded-md bg-background">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-40 cursor-pointer justify-start">
                        <SubtaskAssigneeButton subtask={subtask} {...props} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="space-y-2">
                        {props.members?.map((member) => (
                            <SubtaskMemberOption key={member.id} member={member} subtask={subtask} {...props} />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function SubtaskAssigneeButton({ subtask, ...props }: TaskSubtasksPanelProps & { subtask: TaskSubtask }) {
    if ((props.assignedSubtaskUsers[subtask.id]?.length || 0) === 0) {
        return (
            <>
                <i className="fa-solid fa-circle-user fa-lg"></i>
                <p>não atribuida</p>
            </>
        );
    }

    return <SubtaskAvatarStack subtask={subtask} getInitials={props.getInitials} />;
}

function SubtaskAvatarStack({ subtask, getInitials }: { subtask: TaskSubtask; getInitials: (name: string) => string }) {
    return (
        <div className="flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background">
            {subtask.users?.map((user) => (
                <Avatar key={user.id}>
                    <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
            ))}
        </div>
    );
}

function SubtaskMemberOption({ member, subtask, ...props }: TaskSubtasksPanelProps & { member: User; subtask: TaskSubtask }) {
    const isAssigned = props.assignedSubtaskUsers[subtask.id]?.includes(String(member.id)) || false;

    return (
        <div className="flex items-center space-x-2">
            <Checkbox
                id={`member-${member.id}`}
                checked={isAssigned}
                onCheckedChange={() => props.onSubtaskUserAssignment(String(member.id), subtask.id)}
            />
            <img className="h-8 w-8 rounded-full" src={member.avatar} alt="" />
            <label
                htmlFor={`member-${member.id}`}
                className="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
                {member.name}
            </label>
        </div>
    );
}

function NewSubtaskRow(props: TaskSubtasksPanelProps) {
    return (
        <div className="border-b border-border/70 bg-background/70 hover:bg-muted/60">
            <div className="flex items-center gap-4 px-6 py-4">
                <div className="w-4"></div>
                <NewSubtaskInput {...props} />
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="w-40 text-sm text-muted-foreground">não atribuida</div>
            </div>
        </div>
    );
}

function NewSubtaskInput(props: TaskSubtasksPanelProps) {
    return (
        <input
            data-testid="kanban-new-subtask-input"
            type="text"
            value={props.newSubtaskTitle}
            onChange={(event) => props.setNewSubtaskTitle(event.target.value)}
            onKeyDown={(event) => handleNewSubtaskKey(event, props)}
            placeholder="Subtask title..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
        />
    );
}

function handleNewSubtaskKey(event: React.KeyboardEvent<HTMLInputElement>, props: TaskSubtasksPanelProps): void {
    if (event.key === 'Enter') {
        props.createSubtask();
    } else if (event.key === 'Escape') {
        props.cancelCreatingSubtask();
    }
}
