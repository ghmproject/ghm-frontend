"use client";

import { useEffect, useState } from "react";

type UseDeferredReadyOptions = {
  /** Max wait before enabling deferred work (ms). */
  timeoutMs?: number;
  /** Fallback delay when requestIdleCallback is unavailable. */
  fallbackDelayMs?: number;
};

/**
 * Defers non-critical work until the browser is idle (or timeout).
 * Keeps first paint fast on slow networks.
 */
export function useDeferredReady({
  timeoutMs = 2800,
  fallbackDelayMs = 1200,
}: UseDeferredReadyOptions = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as Window & {
      requestIdleCallback?: (
        cb: IdleRequestCallback,
        opts?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const id = win.requestIdleCallback(() => setReady(true), { timeout: timeoutMs });
      return () => win.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(() => setReady(true), fallbackDelayMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs, fallbackDelayMs]);

  return ready;
}
