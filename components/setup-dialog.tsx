"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { useRaceStore } from "@/lib/store";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { driverChangeWindow, refuelWindow } from "@/lib/race-rules";
import type { DriverId, TeamNumber } from "@/lib/types";

export function SetupDialog() {
  const config = useRaceStore((s) => s.config);
  const setTeamNumber = useRaceStore((s) => s.setTeamNumber);
  const setDriverName = useRaceStore((s) => s.setDriverName);
  const setStintOrder = useRaceStore((s) => s.setStintOrder);
  const setDriverChangeMinute = useRaceStore((s) => s.setDriverChangeMinute);
  const status = useRaceStore((s) => s.status);
  const [open, setOpen] = useState(false);

  const w1 = refuelWindow(config.teamNumber, 1);
  const w2 = refuelWindow(config.teamNumber, 2);
  const dc1 = driverChangeWindow(1, {
    minute1: config.driverChangeMinute1,
    minute2: config.driverChangeMinute2,
  });
  const dc2 = driverChangeWindow(2, {
    minute1: config.driverChangeMinute1,
    minute2: config.driverChangeMinute2,
  });

  const onDcMinuteChange = (index: 1 | 2, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      setDriverChangeMinute(index, undefined);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    setDriverChangeMinute(index, n);
  };

  const setStint = (idx: 0 | 1 | 2, driverId: DriverId) => {
    const next = [...config.stintOrder] as [DriverId, DriverId, DriverId];
    next[idx] = driverId;
    setStintOrder(next);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
          Setup
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Race setup</DialogTitle>
          <DialogDescription>
            {status === "running"
              ? "Race is running — config edits won't change windows mid-race. Restart for a clean run."
              : "Configure team number and stint plan. Saved automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team">Team number (1–10)</Label>
            <Input
              id="team"
              type="number"
              min={1}
              max={10}
              value={config.teamNumber}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= 1 && n <= 10) setTeamNumber(n as TeamNumber);
              }}
            />
            <p className="text-xs text-zinc-500">
              Refuel windows for team {config.teamNumber}: min {w1.openMin} and {w2.openMin}.
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-zinc-800 p-3">
            <Label>Driver-change stop minutes (briefing draw)</Label>
            <p className="text-xs text-zinc-500">
              Leave empty to use the default windows (18–20 and 38–40). If the
              briefing assigns you a specific minute, enter it here — the window
              narrows to a 1-minute slot.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dc1" className="text-zinc-500">
                  Stop 1 (between 18–20)
                </Label>
                <Input
                  id="dc1"
                  type="number"
                  min={18}
                  max={20}
                  step={1}
                  placeholder="auto 18–20"
                  value={config.driverChangeMinute1 ?? ""}
                  onChange={(e) => onDcMinuteChange(1, e.target.value)}
                />
                <p className="text-[11px] text-zinc-500 font-mono tabular-nums">
                  Window: {dc1.openMin}:00–{dc1.closeMin}:00
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dc2" className="text-zinc-500">
                  Stop 2 (between 38–40)
                </Label>
                <Input
                  id="dc2"
                  type="number"
                  min={38}
                  max={40}
                  step={1}
                  placeholder="auto 38–40"
                  value={config.driverChangeMinute2 ?? ""}
                  onChange={(e) => onDcMinuteChange(2, e.target.value)}
                />
                <p className="text-[11px] text-zinc-500 font-mono tabular-nums">
                  Window: {dc2.openMin}:00–{dc2.closeMin}:00
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {config.drivers.map((d) => (
              <div key={d.id} className="space-y-2">
                <Label htmlFor={`d-${d.id}`}>Driver “{d.id}” name</Label>
                <Input
                  id={`d-${d.id}`}
                  value={d.name}
                  onChange={(e) => setDriverName(d.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Stint order</Label>
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2] as const).map((i) => (
                <div key={i} className="rounded-md border border-zinc-800 p-2">
                  <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">
                    Stint {i + 1}
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {config.drivers.map((d) => {
                      const active = config.stintOrder[i] === d.id;
                      return (
                        <Button
                          key={d.id}
                          type="button"
                          size="sm"
                          variant={active ? "primary" : "outline"}
                          onClick={() => setStint(i, d.id)}
                        >
                          {d.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              Rule (Art. 1d): the same driver can&apos;t run two consecutive stints — disqualification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
