import { vi } from 'vitest';

type EchoPayload = Record<string, unknown>;
type EchoCallback<TPayload extends EchoPayload> = (payload: TPayload) => void;

const echoListeners = new Map<string, EchoCallback<EchoPayload>[]>();

export const whisperMock = vi.fn();

export function resetEchoMocks(): void {
    echoListeners.clear();
    whisperMock.mockReset();
}

export function emitEcho<TPayload extends EchoPayload>(channel: string, event: string, payload: TPayload): void {
    echoListeners.get(listenerKey(channel, event))?.forEach((callback) => callback(payload));
}

type MockFunction = ReturnType<typeof vi.fn>;

interface EchoChannelMock {
    listenForWhisper: MockFunction;
    whisper: typeof whisperMock;
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
            listenForWhisper: vi.fn(),
            whisper: whisperMock,
        }),
    };
}

export function useEchoNotificationMock<TPayload extends EchoPayload>(
    channel: string,
    callback?: EchoCallback<TPayload>,
): { channel: () => EchoChannelMock } {
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
