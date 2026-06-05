"use client";

import { useState } from "react";
import {
  Play,
  LogIn,
  ArrowRightLeft,
  Fuel,
  CircleDot,
  LogOut,
  AlertCircle,
  Flag,
  RotateCcw,
} from "lucide-react";
import { useRaceStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ActionPanel() {
  const state = useRaceStore();
  const [violationOpen, setViolationOpen] = useState(false);
  const [violationMsg, setViolationMsg] = useState<string[]>([]);
  const [penaltyOpen, setPenaltyOpen] = useState(false);
  const [penaltySec, setPenaltySec] = useState("120");
  const [penaltyNote, setPenaltyNote] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const running = state.status === "running";
  const idle = state.status === "idle";
  const finished = state.status === "finished";
  const nextDriverId =
    state.currentStint === 1
      ? state.config.stintOrder[1]
      : state.currentStint === 2
      ? state.config.stintOrder[2]
      : null;
  const nextDriverName = nextDriverId
    ? state.config.drivers.find((d) => d.id === nextDriverId)?.name ?? nextDriverId
    : null;

  const tryDriverChange = () => {
    const res = state.driverChange();
    if (!res.ok || res.reasons.length > 0) {
      setViolationMsg(res.reasons);
      setViolationOpen(true);
    }
  };

  const tryRefuelStart = () => {
    const res = state.refuelStart();
    if (!res.ok || res.reasons.length > 0) {
      setViolationMsg(res.reasons);
      setViolationOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {idle && (
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={() => state.startRace()}
          >
            <Play className="h-6 w-6" />
            Start Race
          </Button>
        )}

        {running && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={state.inPit ? "secondary" : "outline"}
                size="lg"
                onClick={() => (state.inPit ? state.pitOut() : state.pitIn("other"))}
              >
                {state.inPit ? (
                  <>
                    <LogOut className="h-5 w-5" />
                    Pit Out
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Pit In
                  </>
                )}
              </Button>

              <Button
                variant="warning"
                size="lg"
                onClick={tryDriverChange}
                disabled={state.currentStint >= 3 || state.refuelInProgress !== false}
              >
                <ArrowRightLeft className="h-5 w-5" />
                {nextDriverName ? `Change → ${nextDriverName}` : "Change driver"}
              </Button>

              <Button
                variant={state.refuelInProgress !== false ? "danger" : "warning"}
                size="lg"
                onClick={() =>
                  state.refuelInProgress !== false
                    ? state.refuelEnd()
                    : tryRefuelStart()
                }
                disabled={
                  state.refuelInProgress === false &&
                  state.refuelsCompleted >= 2
                }
              >
                <Fuel className="h-5 w-5" />
                {state.refuelInProgress !== false ? "End Refuel" : "Start Refuel"}
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={() => state.jokerLapDoneAction()}
                disabled={state.jokerLapDone[state.currentStint]}
              >
                <CircleDot className="h-5 w-5" />
                Joker Lap Done
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPenaltyOpen(true)}
              >
                <AlertCircle className="h-5 w-5" />
                Add Penalty
              </Button>
              <Button variant="danger" size="lg" onClick={() => state.finishRace()}>
                <Flag className="h-5 w-5" />
                Finish Race
              </Button>
            </div>
          </>
        )}

        {(finished || running) && (
          <Button
            variant="ghost"
            size="default"
            className="w-full"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
            New Race
          </Button>
        )}
      </CardContent>

      {/* Violation dialog */}
      <Dialog open={violationOpen} onOpenChange={setViolationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400">Rule check</DialogTitle>
            <DialogDescription>
              The following rule conditions were flagged. Penalties (if applicable) have been recorded automatically.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1">
            {violationMsg.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button onClick={() => setViolationOpen(false)} variant="primary">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Penalty dialog */}
      <Dialog open={penaltyOpen} onOpenChange={setPenaltyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add penalty</DialogTitle>
            <DialogDescription>
              Manually log a penalty announced by the Director of the race.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="psec">Seconds</Label>
              <Input
                id="psec"
                type="number"
                value={penaltySec}
                onChange={(e) => setPenaltySec(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pnote">Note</Label>
              <Input
                id="pnote"
                value={penaltyNote}
                onChange={(e) => setPenaltyNote(e.target.value)}
                placeholder="Reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPenaltyOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                const sec = Number(penaltySec);
                if (Number.isFinite(sec) && sec > 0) {
                  state.addPenalty(sec, penaltyNote || "Manual penalty");
                  setPenaltyNote("");
                  setPenaltySec("120");
                  setPenaltyOpen(false);
                }
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a new race?</DialogTitle>
            <DialogDescription>
              This wipes the current race state (clock, events, penalties). Team and driver setup are preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                state.resetRace();
                setResetOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
