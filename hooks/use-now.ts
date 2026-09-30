import { useEffect, useState } from "react";

/**
 * A ticking clock for countdowns. Screens call this instead of re-rendering the
 * whole store every second.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useCountdown(target: number, intervalMs = 1000): number {
  const now = useNow(intervalMs);
  return Math.max(0, target - now);
}
