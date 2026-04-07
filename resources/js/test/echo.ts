import { vi } from 'vitest';

type EchoPayload = Record<string, unknown>;
type EchoCallback<TPayload extends EchoPayload> = (payload: TPayload) => void;
type MockFunction = ReturnType<typeof vi.fn>;

interface EchoChannelMock {
    here: typeof hereMock;
    joining: typeof joiningMock;
    leaving: typeof leavingMock;
    listenForWhisper: MockFunction;
    whisper: typeof whisperMock;
}

const echoListeners = new Map<string, EchoCallback<EchoPayload>[]>();

export const whisperMock = vi.fn();
export const hereMock = vi.fn();
export const joiningMock = vi.fn();
export const leavingMock = vi.fn();

export function resetEchoMocks(): void {
    echoListeners.clear();
    whisperMock.mockReset();
    hereMock.mockReset();
    joiningMock.mockReset();
    leavingMock.mockReset();
}

export function emitEcho<TPayload extends EchoPayload>(channel: string, event: string, payload: TPayload): void {
    echoListeners.get(listenerKey(channel, event))?.forEach((callback) => callback(payload));
}

export function useEchoMock<TPayload extends EchoPayload>(
    channel: string,
    event?: string,
    callback?: EchoCallback<TPayload>,
): { channel: () => EchoChannelMock } {
    if (event && callback) {
        const key = listenerKey(channel, event);
        echoListeners.set(key, [callback as EchoCallback<EchoPayload>]);
    }

    return {
        channel: () => ({
            here: hereMock,
            joining: joiningMock,
            leaving: leavingMock,
            listenForWhisper: vi.fn(),
            whisper: whisperMock,
        }),
    };
}

export function useEchoPresenceMock<TPayload extends EchoPayload>(
    channel: string,
    event?: string | string[],
    callback?: EchoCallback<TPayload>,
): ReturnType<typeof useEchoMock<TPayload>> {
    return useEchoMock(channel, Array.isArray(event) ? event[0] : event, callback);
}

export function useEchoNotificationMock<TPayload extends EchoPayload>(
    channel: string,
    callback?: EchoCallback<TPayload>,
): { channel: () => Pick<EchoChannelMock, 'listenForWhisper' | 'whisper'> } {
    if (callback) {
        echoListeners.set(listenerKey(channel, 'notification'), [callback as EchoCallback<EchoPayload>]);
    }

    return {
        channel: () => ({
            listenForWhisper: vi.fn(),
            whisper: whisperMock,
        }),
    };
}

function listenerKey(channel: string, event: string): string {
    return `${channel}:${event}`;
}
