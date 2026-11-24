import { useCallback, useEffect, useRef } from "react";

/**
 * Sanctioned declarative timer hooks (`lib/hooks/useTimers.ts`).
 * Encapsulates browser timer cleanup so UI components avoid raw unmanaged
 * `setTimeout` / `setInterval` / `requestAnimationFrame` calls.
 */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => savedCallback.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}

export function useSafeTimeout(): (callback: () => void, delayMs: number) => void {
  const timersRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const active = timersRef.current;
    return () => {
      active.forEach((id) => window.clearTimeout(id));
      active.clear();
    };
  }, []);

  return useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timersRef.current.delete(id);
      callback();
    }, delayMs);
    timersRef.current.add(id);
  }, []);
}
