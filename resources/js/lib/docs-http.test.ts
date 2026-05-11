import { formHeaders, jsonHeaders, socketHeaders } from '@/lib/docs-http';
import { echoIsConfiguredMock, echoSocketIdMock } from '@/test/echo';
import { describe, expect, it } from 'vitest';

describe('docs-http', () => {
    it('adds the Echo socket id to document fetch headers', () => {
        echoIsConfiguredMock.mockReturnValue(true);
        echoSocketIdMock.mockReturnValue('123.456');

        expect(socketHeaders()).toEqual({ 'X-Socket-Id': '123.456' });
        expect(jsonHeaders()).toMatchObject({ 'X-Socket-Id': '123.456' });
        expect(formHeaders()).toMatchObject({ 'X-Socket-Id': '123.456' });
    });

    it('omits the Echo socket header before Echo is configured', () => {
        expect(socketHeaders()).toEqual({});
        expect(jsonHeaders()).not.toHaveProperty('X-Socket-Id');
        expect(formHeaders()).not.toHaveProperty('X-Socket-Id');
    });
});
