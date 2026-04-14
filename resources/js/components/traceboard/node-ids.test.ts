import { describe, expect, it } from 'vitest';
import { createTraceboardNodeId } from './node-ids';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('createTraceboardNodeId', () => {
    it('creates UUID-shaped ids for new task and note nodes', () => {
        const taskNodeId = createTraceboardNodeId();
        const noteNodeId = createTraceboardNodeId();

        expect(taskNodeId).toMatch(uuidPattern);
        expect(noteNodeId).toMatch(uuidPattern);
        expect(taskNodeId).not.toContain('_');
        expect(noteNodeId).not.toContain('_');
    });
});
