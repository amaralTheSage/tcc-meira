import { buildColumn, buildSubtask, buildTask, buildUser } from '@/test/factories';
import type { Column } from '@/types/models';
import { describe, expect, it } from 'vitest';
import {
    applySubtaskAssignmentToColumns,
    applyTaskAssignmentToColumns,
    type SubtaskAssignmentPayload,
    type TaskAssignmentPayload,
} from './assignment-events';

describe('Kanban assignment events', () => {
    it('assigns users to tasks without duplicating existing members', () => {
        const assignee = buildUser({ id: 7 });
        const columns = columnsWithTask({ users: [assignee] });
        const payload = taskPayload(assignee, true);

        const updatedColumns = applyTaskAssignmentToColumns(columns, payload, 'project-1');
        const updatedUsers = updatedColumns[0].tasks?.[0].users;

        expect(updatedUsers).toHaveLength(1);
        expect(updatedUsers?.[0].id).toBe(7);
    });

    it('detaches users from tasks', () => {
        const assignee = buildUser({ id: 7 });
        const columns = columnsWithTask({ users: [assignee] });
        const payload = taskPayload(assignee, false);

        const updatedColumns = applyTaskAssignmentToColumns(columns, payload, 'project-1');
        const updatedUsers = updatedColumns[0].tasks?.[0].users;

        expect(updatedUsers).toEqual([]);
    });

    it('assigns users to subtasks', () => {
        const assignee = buildUser({ id: 7 });
        const columns = columnsWithTask({ subtasks: [buildSubtask({ id: 'subtask-1' })] });
        const payload = subtaskPayload(assignee, true);

        const updatedColumns = applySubtaskAssignmentToColumns(columns, payload, 'project-1');
        const updatedUsers = updatedColumns[0].tasks?.[0].subtasks[0].users;

        expect(updatedUsers?.[0].id).toBe(7);
    });

    it('detaches users from subtasks', () => {
        const assignee = buildUser({ id: 7 });
        const subtask = buildSubtask({ id: 'subtask-1', users: [assignee] });
        const columns = columnsWithTask({ subtasks: [subtask] });
        const payload = subtaskPayload(assignee, false);

        const updatedColumns = applySubtaskAssignmentToColumns(columns, payload, 'project-1');
        const updatedUsers = updatedColumns[0].tasks?.[0].subtasks[0].users;

        expect(updatedUsers).toEqual([]);
    });

    it('ignores assignment payloads for other projects', () => {
        const assignee = buildUser({ id: 7 });
        const columns = columnsWithTask();
        const payload = taskPayload(assignee, true, 'project-2');

        const updatedColumns = applyTaskAssignmentToColumns(columns, payload, 'project-1');

        expect(updatedColumns).toBe(columns);
    });
});

function columnsWithTask(overrides: Partial<NonNullable<Column['tasks']>[number]> = {}): Column[] {
    return [
        buildColumn({
            tasks: [
                buildTask({
                    id: 'task-1',
                    project_id: 'project-1',
                    ...overrides,
                }),
            ],
        }),
    ];
}

function taskPayload(user: TaskAssignmentPayload['user'], assigned: boolean, projectId = 'project-1'): TaskAssignmentPayload {
    return {
        assigned,
        projectId,
        taskId: 'task-1',
        user,
    };
}

function subtaskPayload(user: SubtaskAssignmentPayload['user'], assigned: boolean): SubtaskAssignmentPayload {
    return {
        ...taskPayload(user, assigned),
        subtaskId: 'subtask-1',
    };
}
