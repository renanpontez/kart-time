"use client";

import { useRaceStore, elapsedFromState } from "@/lib/store";
import { useTick } from "./use-tick";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatMMSS } from "@/lib/time";
import { buildWindows, windowState } from "@/lib/race-rules";
import type { RaceWindow, WindowState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATE_LABEL: Record<WindowState, string> = {
  upcoming: "Upcoming",
  opening_soon: "Opens soon",
  open: "Open now",
  closed_ok: "Closed",
  missed: "Missed",
};

const STATE_VARIANT: Record<WindowState, "default" | "ok" | "warn" | "danger" | "outline"> = {
  upcoming: "outline",
  opening_soon: "warn",
  open: "ok",
  closed_ok: "default",
  missed: "danger",
};

function done(state: ReturnType<typeof useRaceStore.getState>, w: RaceWindow): boolean {
  if (w.kind === "driver_change_1") return state.currentStint >= 2;
  if (w.kind === "driver_change_2") return state.currentStint >= 3;
  if (w.kind === "refuel_1") return state.refuelsCompleted >= 1;
  if (w.kind === "refuel_2") return state.refuelsCompleted >= 2;
  return false;
}

function WindowCard({ win, elapsed, isDone }: { win: RaceWindow; elapsed: number; isDone: boolean }) {
  let state = windowState(elapsed, win);
  if (state === "closed_ok" && !isDone) state = "missed";

  let secondary = "";
  if (state === "upcoming") {
    secondary = `T-${formatMMSS(win.openSec - elapsed)}`;
  } else if (state === "opening_soon") {
    secondary = `Opens in ${formatMMSS(win.openSec - elapsed)}`;
  } else if (state === "open") {
    secondary = `${formatMMSS(win.closeSec - elapsed)} left`;
  } else if (state === "closed_ok") {
    secondary = "Completed ✓";
  } else if (state === "missed") {
    secondary = "Window passed";
  }

  return (
    <Card
      className={cn(
        "transition-colors",
        state === "open" && "border-emerald-500 bg-emerald-950/40",
        state === "opening_soon" && "border-amber-500 bg-amber-950/30 animate-pulse",
        state === "missed" && "border-red-500 bg-red-950/40",
      )}
    >
      <CardHeader>
        <CardTitle>{win.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="font-mono text-lg font-bold tabular-nums text-zinc-100">
          {formatMMSS(win.openSec)}–{formatMMSS(win.closeSec)}
        </div>
        <Badge variant={STATE_VARIANT[state]}>{STATE_LABEL[state]}</Badge>
        <div className="text-xs text-zinc-400 font-mono tabular-nums">{secondary}</div>
      </CardContent>
    </Card>
  );
}

export function WindowStatus() {
  const status = useRaceStore((s) => s.status);
  const startedAt = useRaceStore((s) => s.startedAt);
  const finishedAt = useRaceStore((s) => s.finishedAt);
  const teamNumber = useRaceStore((s) => s.config.teamNumber);
  const dc1Override = useRaceStore((s) => s.config.driverChangeMinute1);
  const dc2Override = useRaceStore((s) => s.config.driverChangeMinute2);
  const fullState = useRaceStore((s) => s);
  const now = useTick(500);
  const elapsed = elapsedFromState({ status, startedAt, finishedAt }, now);
  const windows = buildWindows(teamNumber, {
    minute1: dc1Override,
    minute2: dc2Override,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {windows.map((w) => (
        <WindowCard key={w.kind} win={w} elapsed={elapsed} isDone={done(fullState, w)} />
      ))}
    </div>
  );
}
