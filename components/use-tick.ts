"use client";

import { useEffect, useState } from "react";

/**
 * Returns a re-render trigger at a fixed interval. Used to drive the race
 * clock without touching the persisted store on every tick.
 */
export function useTick(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
