"use client";

import { useRaceStore, elapsedFromState } from "@/lib/store";
import { useTick } from "./use-tick";
import { formatMMSS } from "@/lib/time";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Flag, CheckCircle2, AlertTriangle } from "lucide-react";

function stintStartSec(stint: 1 | 2 | 3): number {
  if (stint === 1) return 0;
  if (stint === 2) return 19 * 60; // approximate, real start is the driver_change event
  return 39 * 60;
}

export function StintCard() {
  const status = useRaceStore((s) => s.status);
  const startedAt = useRaceStore((s) => s.startedAt);
  const finishedAt = useRaceStore((s) => s.finishedAt);
  const currentStint = useRaceStore((s) => s.currentStint);
  const currentDriver = useRaceStore((s) => s.currentDriver);
  const drivers = useRaceStore((s) => s.config.drivers);
  const stintOrder = useRaceStore((s) => s.config.stintOrder);
  const jokerLapDone = useRaceStore((s) => s.jokerLapDone);
  const events = useRaceStore((s) => s.events);
  const now = useTick(500);
  const elapsed = elapsedFromState({ status, startedAt, finishedAt }, now);

  const driverName =
    drivers.find((d) => d.id === currentDriver)?.name ?? currentDriver;

  // Find latest driver_change event for the current stint to compute stint elapsed precisely.
  let stintStart = stintStartSec(currentStint);
  if (currentStint === 1) {
    stintStart = 0;
  } else {
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (ev.type === "driver_change" && ev.data?.stint === currentStint) {
        stintStart = ev.elapsedSec;
        break;
      }
    }
  }
  const stintElapsed = Math.max(0, elapsed - stintStart);

  const jokerDone = jokerLapDone[currentStint];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Active Stint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Stint
            </div>
            <div className="text-5xl font-bold tabular-nums text-zinc-50">
              {currentStint}
              <span className="text-zinc-500 text-2xl"> / 3</span>
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Driver
            </div>
            <div className="text-3xl font-bold uppercase text-emerald-400">
              {driverName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Stint elapsed
            </div>
            <div className="font-mono text-3xl font-bold tabular-nums text-zinc-100">
              {formatMMSS(stintElapsed)}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Joker Lap
            </div>
            {jokerDone ? (
              <Badge variant="ok" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Done
              </Badge>
            ) : status === "running" ? (
              <Badge variant="warn" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Pending
              </Badge>
            ) : (
              <Badge variant="outline">—</Badge>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3" />
            <span className="uppercase tracking-widest">Plan</span>
          </div>
          <div className="mt-1 flex gap-2 text-sm">
            {stintOrder.map((id, i) => {
              const d = drivers.find((x) => x.id === id);
              const idx = (i + 1) as 1 | 2 | 3;
              const isCurrent = idx === currentStint;
              const isDone = idx < currentStint;
              return (
                <span
                  key={i}
                  className={
                    isCurrent
                      ? "text-emerald-400 font-semibold"
                      : isDone
                      ? "text-zinc-600 line-through"
                      : "text-zinc-300"
                  }
                >
                  {idx}.{d?.name ?? id}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
