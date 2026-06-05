import type {
  RaceState,
  RaceWindow,
  TeamNumber,
  ValidationResult,
  WindowKind,
  WindowState,
} from "./types";

export const RACE_DURATION_SEC = 60 * 60;
export const OPENING_SOON_LEAD_SEC = 60;
export const BOX_OPEN_MAX_SEC = 120;
export const OUTSIDE_WINDOW_PENALTY_SEC = 120;
export const MISSED_JOKER_PENALTY_SEC = 120;

/**
 * Driver-change windows are the same for all teams per Article 3a: minutes 18-20 and 38-40.
 */
export function driverChangeWindow(index: 1 | 2): { openMin: number; closeMin: number } {
  return index === 1 ? { openMin: 18, closeMin: 20 } : { openMin: 38, closeMin: 40 };
}

/**
 * Refuel windows per Article 11 (cronograma):
 *  Teams 01/02 → minute 21 and 41
 *  Teams 03/04 → minute 22 and 42
 *  Teams 05/06 → minute 23 and 43
 *  Teams 07/08 → minute 24 and 44
 *  Teams 09/10 → minute 25 and 45
 * Each refuel slot is one minute long.
 */
export function refuelWindow(team: TeamNumber, index: 1 | 2): { openMin: number; closeMin: number } {
  const slot = Math.ceil(team / 2);
  const baseFirst = 20 + slot;
  const baseSecond = 40 + slot;
  const openMin = index === 1 ? baseFirst : baseSecond;
  return { openMin, closeMin: openMin + 1 };
}

export function buildWindows(team: TeamNumber): RaceWindow[] {
  const dc1 = driverChangeWindow(1);
  const r1 = refuelWindow(team, 1);
  const dc2 = driverChangeWindow(2);
  const r2 = refuelWindow(team, 2);
  return [
    {
      kind: "driver_change_1",
      label: "Driver Change 1",
      openSec: dc1.openMin * 60,
      closeSec: dc1.closeMin * 60,
    },
    {
      kind: "refuel_1",
      label: "Refuel 1",
      openSec: r1.openMin * 60,
      closeSec: r1.closeMin * 60,
    },
    {
      kind: "driver_change_2",
      label: "Driver Change 2",
      openSec: dc2.openMin * 60,
      closeSec: dc2.closeMin * 60,
    },
    {
      kind: "refuel_2",
      label: "Refuel 2",
      openSec: r2.openMin * 60,
      closeSec: r2.closeMin * 60,
    },
  ];
}

export function windowState(elapsed: number, w: RaceWindow): WindowState {
  if (elapsed < w.openSec - OPENING_SOON_LEAD_SEC) return "upcoming";
  if (elapsed < w.openSec) return "opening_soon";
  if (elapsed <= w.closeSec) return "open";
  return "closed_ok";
}

/**
 * "Missed" is the same as closed but contextual — caller decides whether the
 * required action happened during the window. We provide a helper.
 */
export function isMissed(elapsed: number, w: RaceWindow, actionTaken: boolean): boolean {
  return elapsed > w.closeSec && !actionTaken;
}

export function findWindowAt(elapsed: number, windows: RaceWindow[]): RaceWindow | null {
  return windows.find((w) => elapsed >= w.openSec && elapsed <= w.closeSec) ?? null;
}

export function nextWindow(elapsed: number, windows: RaceWindow[]): RaceWindow | null {
  return windows.find((w) => elapsed < w.openSec) ?? null;
}

export function validateDriverChange(
  state: RaceState,
  elapsed: number,
  nextDriverId: string,
): ValidationResult {
  const reasons: string[] = [];
  let penalty = 0;

  if (state.status !== "running") {
    reasons.push("Race is not running.");
    return { ok: false, reasons, penaltySec: 0 };
  }

  if (state.refuelInProgress !== false) {
    reasons.push("Driver change during refuel is FORBIDDEN (Art. 4d → DSQ).");
    return { ok: false, reasons, penaltySec: 0 };
  }

  if (nextDriverId === state.currentDriver) {
    reasons.push("Same driver cannot run two consecutive stints (Art. 1d → DSQ).");
    return { ok: false, reasons, penaltySec: 0 };
  }

  const dcIndex: 1 | 2 = state.currentStint === 1 ? 1 : 2;
  const win = driverChangeWindow(dcIndex);
  const openSec = win.openMin * 60;
  const closeSec = win.closeMin * 60;

  if (elapsed < openSec || elapsed > closeSec) {
    reasons.push(`Outside driver-change window ${win.openMin}-${win.closeMin}m (Art. 3b → +120s).`);
    penalty += OUTSIDE_WINDOW_PENALTY_SEC;
  }

  return { ok: true, reasons, penaltySec: penalty };
}

export function validateRefuel(
  state: RaceState,
  elapsed: number,
): ValidationResult {
  const reasons: string[] = [];
  let penalty = 0;

  if (state.status !== "running") {
    reasons.push("Race is not running.");
    return { ok: false, reasons, penaltySec: 0 };
  }

  if (state.refuelsCompleted >= 2) {
    reasons.push("Both refuel stops already completed.");
    return { ok: false, reasons, penaltySec: 0 };
  }

  const idx: 1 | 2 = (state.refuelsCompleted + 1) as 1 | 2;
  const win = refuelWindow(state.config.teamNumber, idx);
  const openSec = win.openMin * 60;
  const closeSec = win.closeMin * 60;

  if (elapsed < openSec || elapsed > closeSec) {
    reasons.push(`Outside refuel window (team ${state.config.teamNumber} → min ${win.openMin}) (Art. 4 → +120s).`);
    penalty += OUTSIDE_WINDOW_PENALTY_SEC;
  }

  return { ok: true, reasons, penaltySec: penalty };
}

export type Compliance = {
  level: "ok" | "warn" | "violation";
  messages: string[];
};

export function computeCompliance(state: RaceState, elapsed: number): Compliance {
  const messages: string[] = [];
  let level: Compliance["level"] = "ok";

  if (state.status !== "running") {
    return { level: "ok", messages: [] };
  }

  const windows = buildWindows(state.config.teamNumber);

  // Driver change 1 missed?
  const dc1 = windows[0];
  const dc1Done = state.currentStint >= 2;
  if (elapsed > dc1.closeSec && !dc1Done) {
    messages.push("Missed Driver Change 1 window (+120s).");
    level = "violation";
  }

  // Refuel 1 missed?
  const r1 = windows[1];
  if (elapsed > r1.closeSec && state.refuelsCompleted < 1) {
    messages.push(`Missed Refuel 1 window (+120s).`);
    level = "violation";
  }

  // Driver change 2 missed?
  const dc2 = windows[2];
  const dc2Done = state.currentStint >= 3;
  if (elapsed > dc2.closeSec && !dc2Done) {
    messages.push("Missed Driver Change 2 window (+120s).");
    level = "violation";
  }

  // Refuel 2 missed?
  const r2 = windows[3];
  if (elapsed > r2.closeSec && state.refuelsCompleted < 2) {
    messages.push("Missed Refuel 2 window (+120s).");
    level = "violation";
  }

  // Joker lap missed for previous stints
  if (state.currentStint >= 2 && !state.jokerLapDone[1]) {
    messages.push("Stint 1 Joker Lap not registered (+120s).");
    level = "violation";
  }
  if (state.currentStint >= 3 && !state.jokerLapDone[2]) {
    messages.push("Stint 2 Joker Lap not registered (+120s).");
    level = "violation";
  }

  // Window-open warning (UI hint)
  const inWindow = findWindowAt(elapsed, windows);
  if (inWindow && level === "ok") {
    messages.push(`${inWindow.label} window OPEN — execute the stop.`);
    level = "warn";
  }

  // Refuel in progress
  if (state.refuelInProgress !== false) {
    messages.push("Refuel in progress — driver change FORBIDDEN.");
    if (level === "ok") level = "warn";
  }

  return { level, messages };
}

export function projectedFinalSec(state: RaceState, elapsed: number): number {
  const base = state.status === "finished" && state.finishedAt && state.startedAt
    ? Math.floor((state.finishedAt - state.startedAt) / 1000)
    : Math.max(elapsed, RACE_DURATION_SEC);
  return base + state.penaltySec;
}

export const WINDOW_KIND_LABEL: Record<WindowKind, string> = {
  driver_change_1: "Driver Change 1",
  refuel_1: "Refuel 1",
  driver_change_2: "Driver Change 2",
  refuel_2: "Refuel 2",
};
