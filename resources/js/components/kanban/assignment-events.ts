import type { User } from '@/types';
import type { Column, ColumnTask, TaskSubtask } from '@/types/models';

export interface TaskAssignmentPayload {
    assigned: boolean;
    projectId: string;
    taskId: string;
    user: User;
}

export interface SubtaskAssignmentPayload extends TaskAssignmentPayload {
    subtaskId: string;
}

/**
 * Applies a task assignee broadcast to the in-memory Kanban columns.
 *
 * @example
 * applyTaskAssignmentToColumns(columns, payload, project.id);
 */
export function applyTaskAssignmentToColumns(columns: Column[], payload: TaskAssignmentPayload, projectId: string): Column[] {
    if (!isPayloadForProject(payload, projectId)) {
        return columns;
    }

    return columns.map((column) => ({
        ...column,
        tasks: column.tasks?.map((task) => withTaskAssignee(task, payload)),
    }));
}

/**
 * Applies a subtask assignee broadcast to the in-memory Kanban columns.
 *
 * @example
 * applySubtaskAssignmentToColumns(columns, payload, project.id);
 */
export function applySubtaskAssignmentToColumns(columns: Column[], payload: SubtaskAssignmentPayload, projectId: string): Column[] {
    if (!isPayloadForProject(payload, projectId)) {
        return columns;
    }

    return columns.map((column) => ({
        ...column,
        tasks: column.tasks?.map((task) => withSubtaskAssignee(task, payload)),
    }));
}

function isPayloadForProject(payload: TaskAssignmentPayload, projectId: string): boolean {
    const currentProjectId = String(projectId);
    const eventProjectId = String(payload.projectId);

    return currentProjectId === eventProjectId;
}

function withTaskAssignee(task: ColumnTask, payload: TaskAssignmentPayload): ColumnTask {
    if (task.id !== payload.taskId) {
        return task;
    }

    return { ...task, users: usersWithAssignment(task.users, payload) };
}

function withSubtaskAssignee(task: ColumnTask, payload: SubtaskAssignmentPayload): ColumnTask {
    if (task.id !== payload.taskId) {
        return task;
    }

    return {
        ...task,
        subtasks: task.subtasks.map((subtask) => withSubtaskAssigneeList(subtask, payload)),
    };
}

function withSubtaskAssigneeList(subtask: TaskSubtask, payload: SubtaskAssignmentPayload): TaskSubtask {
    if (subtask.id !== payload.subtaskId) {
        return subtask;
    }

    return { ...subtask, users: usersWithAssignment(subtask.users, payload) };
}

function usersWithAssignment(users: User[] | undefined, payload: TaskAssignmentPayload): User[] {
    if (!payload.assigned) {
        return withoutAssignedUser(users ?? [], payload.user);
    }

    return withAssignedUser(users ?? [], payload.user);
}

function withAssignedUser(users: User[], user: User): User[] {
    if (users.some((existingUser) => sameUser(existingUser, user))) {
        return users;
    }

    return [...users, user];
}

function withoutAssignedUser(users: User[], user: User): User[] {
    return users.filter((existingUser) => {
        return !sameUser(existingUser, user);
    });
}

function sameUser(leftUser: User, rightUser: User): boolean {
    const leftId = String(leftUser.id);
    const rightId = String(rightUser.id);

    return leftId === rightId;
}
