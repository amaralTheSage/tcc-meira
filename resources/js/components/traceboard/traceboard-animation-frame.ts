/**
 * Requests the next Traceboard motion frame with a timeout fallback.
 *
 * @example
 * const frameId = requestTraceboardAnimationFrame((timestamp) => console.log(timestamp));
 */
export function requestTraceboardAnimationFrame(callback: FrameRequestCallback): number {
    if (typeof window.requestAnimationFrame === 'function') {
        return window.requestAnimationFrame(callback);
    }

    return window.setTimeout(() => callback(performance.now()), 16);
}

/**
 * Cancels a pending Traceboard motion frame.
 *
 * @example
 * cancelTraceboardAnimationFrame(frameId);
 */
export function cancelTraceboardAnimationFrame(frameId: number): void {
    if (typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
        return;
    }

    window.clearTimeout(frameId);
}
