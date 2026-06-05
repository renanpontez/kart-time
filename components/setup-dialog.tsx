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
import { refuelWindow } from "@/lib/race-rules";
import type { DriverId, TeamNumber } from "@/lib/types";

export function SetupDialog() {
  const config = useRaceStore((s) => s.config);
  const setTeamNumber = useRaceStore((s) => s.setTeamNumber);
  const setDriverName = useRaceStore((s) => s.setDriverName);
  const setStintOrder = useRaceStore((s) => s.setStintOrder);
  const status = useRaceStore((s) => s.status);
  const [open, setOpen] = useState(false);

  const w1 = refuelWindow(config.teamNumber, 1);
  const w2 = refuelWindow(config.teamNumber, 2);

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
