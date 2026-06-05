"use client";

import { useRaceStore, elapsedFromState } from "@/lib/store";
import { useTick } from "./use-tick";
import { formatMMSS } from "@/lib/time";
import { RACE_DURATION_SEC } from "@/lib/race-rules";
import { cn } from "@/lib/utils";

export function RaceClock() {
  const status = useRaceStore((s) => s.status);
  const startedAt = useRaceStore((s) => s.startedAt);
  const finishedAt = useRaceStore((s) => s.finishedAt);
  const now = useTick(250);
  const elapsed = elapsedFromState({ status, startedAt, finishedAt }, now);
  const remaining = Math.max(0, RACE_DURATION_SEC - elapsed);

  const statusLabel =
    status === "idle" ? "READY" : status === "running" ? "LIVE" : "FINISHED";

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-3 w-3 rounded-full",
            status === "running" && "bg-emerald-400 animate-pulse",
            status === "idle" && "bg-zinc-500",
            status === "finished" && "bg-red-500",
          )}
        />
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {statusLabel}
        </span>
      </div>
      <div
        className={cn(
          "font-mono font-bold tabular-nums leading-none tracking-tight",
          "text-[6rem] md:text-[8rem] lg:text-[10rem]",
          status === "finished" ? "text-red-400" : "text-zinc-50",
        )}
      >
        {formatMMSS(elapsed)}
      </div>
      <div className="font-mono text-sm text-zinc-500 tabular-nums">
        / {formatMMSS(RACE_DURATION_SEC)} &nbsp;·&nbsp; remaining {formatMMSS(remaining)}
      </div>
    </div>
  );
}
