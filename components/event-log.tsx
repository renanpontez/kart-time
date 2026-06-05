"use client";

import { useRaceStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatMMSS } from "@/lib/time";
import type { EventType, RaceEvent } from "@/lib/types";
import {
  Play,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Fuel,
  CircleDot,
  AlertCircle,
  Flag,
  StickyNote,
} from "lucide-react";

const ICON: Record<EventType, React.ComponentType<{ className?: string }>> = {
  race_start: Play,
  pit_in: LogIn,
  pit_out: LogOut,
  driver_change: ArrowRightLeft,
  refuel_start: Fuel,
  refuel_end: Fuel,
  joker_lap_done: CircleDot,
  penalty: AlertCircle,
  race_finish: Flag,
  note: StickyNote,
};

const COLOR: Record<EventType, string> = {
  race_start: "text-emerald-400",
  pit_in: "text-amber-400",
  pit_out: "text-zinc-300",
  driver_change: "text-blue-400",
  refuel_start: "text-amber-400",
  refuel_end: "text-zinc-300",
  joker_lap_done: "text-emerald-400",
  penalty: "text-red-400",
  race_finish: "text-red-400",
  note: "text-zinc-400",
};

function describe(ev: RaceEvent, driverName: (id: string) => string): string {
  const d = ev.data ?? {};
  switch (ev.type) {
    case "race_start":
      return `Race start — ${driverName(String(d.driver ?? ""))}`;
    case "pit_in":
      return `Pit in${d.reason ? ` (${d.reason})` : ""}`;
    case "pit_out":
      return "Pit out";
    case "driver_change":
      return `Driver change — ${driverName(String(d.from))} → ${driverName(
        String(d.to),
      )} (stint ${d.stint})`;
    case "refuel_start":
      return `Refuel ${d.index} START`;
    case "refuel_end":
      return `Refuel ${d.index} END`;
    case "joker_lap_done":
      return `Joker Lap done — stint ${d.stint}`;
    case "penalty":
      return `Penalty +${d.seconds}s — ${d.note ?? ""}`;
    case "race_finish":
      return "Race finished";
    case "note":
      return `Note: ${d.note ?? ""}`;
  }
}

export function EventLog() {
  const events = useRaceStore((s) => s.events);
  const drivers = useRaceStore((s) => s.config.drivers);
  const driverName = (id: string) =>
    drivers.find((d) => d.id === id)?.name ?? id;

  const reversed = [...events].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Log</CardTitle>
      </CardHeader>
      <CardContent>
        {reversed.length === 0 ? (
          <p className="text-sm text-zinc-500">No events yet. Press Start Race.</p>
        ) : (
          <ul className="divide-y divide-zinc-900 max-h-[420px] overflow-y-auto">
            {reversed.map((ev) => {
              const Icon = ICON[ev.type];
              return (
                <li
                  key={ev.id}
                  className="flex items-center gap-3 py-2 text-sm"
                >
                  <span className="font-mono text-zinc-500 tabular-nums w-14">
                    {formatMMSS(ev.elapsedSec)}
                  </span>
                  <Icon className={`h-4 w-4 ${COLOR[ev.type]}`} />
                  <span className="flex-1 text-zinc-200">
                    {describe(ev, driverName)}
                  </span>
                  {ev.type === "penalty" && (
                    <Badge variant="danger">+{ev.data?.seconds}s</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
