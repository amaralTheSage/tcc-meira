/**
 * Builds client-owned traceboard node ids that can pass Laravel UUID routing.
 *
 * @example
 * const nodeId = createTraceboardNodeId();
 */
export function createTraceboardNodeId(): string {
    return crypto.randomUUID();
}
