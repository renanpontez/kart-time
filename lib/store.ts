"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DriverId,
  EventType,
  RaceConfig,
  RaceEvent,
  RaceState,
  StintIndex,
  TeamNumber,
} from "./types";
import {
  OUTSIDE_WINDOW_PENALTY_SEC,
  RACE_DURATION_SEC,
  driverChangeWindow,
  refuelWindow,
  validateDriverChange,
  validateRefuel,
} from "./race-rules";

const DEFAULT_CONFIG: RaceConfig = {
  teamNumber: 5,
  drivers: [
    { id: "renan", name: "Renan" },
    { id: "bruno", name: "Bruno" },
  ],
  stintOrder: ["renan", "bruno", "renan"],
  raceDurationSec: RACE_DURATION_SEC,
};

const INITIAL_STATE: RaceState = {
  config: DEFAULT_CONFIG,
  status: "idle",
  startedAt: null,
  finishedAt: null,
  currentStint: 1,
  currentDriver: DEFAULT_CONFIG.stintOrder[0],
  jokerLapDone: { 1: false, 2: false, 3: false },
  refuelsCompleted: 0,
  inPit: false,
  refuelInProgress: false,
  penaltySec: 0,
  events: [],
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function elapsedNow(state: RaceState, now: number): number {
  if (!state.startedAt) return 0;
  if (state.status === "finished" && state.finishedAt) {
    return Math.max(0, Math.floor((state.finishedAt - state.startedAt) / 1000));
  }
  return Math.max(0, Math.floor((now - state.startedAt) / 1000));
}

function makeEvent(
  state: RaceState,
  type: EventType,
  data?: RaceEvent["data"],
  atOverride?: number,
): RaceEvent {
  const at = atOverride ?? Date.now();
  return {
    id: uid(),
    type,
    at,
    elapsedSec: elapsedNow(state, at),
    data,
  };
}

export interface RaceStore extends RaceState {
  setConfig: (cfg: Partial<RaceConfig>) => void;
  setTeamNumber: (n: TeamNumber) => void;
  setDriverName: (id: DriverId, name: string) => void;
  setStintOrder: (order: [DriverId, DriverId, DriverId]) => void;
  setDriverChangeMinute: (index: 1 | 2, minute: number | undefined) => void;

  startRace: () => void;
  pitIn: (reason?: "driver_change" | "refuel" | "other") => void;
  driverChange: () => { ok: boolean; reasons: string[] };
  refuelStart: () => { ok: boolean; reasons: string[] };
  refuelEnd: () => void;
  jokerLapDoneAction: () => void;
  pitOut: () => void;
  addPenalty: (seconds: number, note: string) => void;
  addNote: (note: string) => void;
  finishRace: () => void;
  resetRace: () => void;
}

export const useRaceStore = create<RaceStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setConfig: (cfg) =>
        set((s) => ({
          config: { ...s.config, ...cfg },
          currentDriver:
            s.status === "idle"
              ? (cfg.stintOrder?.[0] ?? s.config.stintOrder[0])
              : s.currentDriver,
        })),

      setTeamNumber: (n) =>
        set((s) => ({ config: { ...s.config, teamNumber: n } })),

      setDriverName: (id, name) =>
        set((s) => ({
          config: {
            ...s.config,
            drivers: s.config.drivers.map((d) =>
              d.id === id ? { ...d, name } : d,
            ),
          },
        })),

      setStintOrder: (order) =>
        set((s) => ({
          config: { ...s.config, stintOrder: order },
          currentDriver: s.status === "idle" ? order[0] : s.currentDriver,
        })),

      setDriverChangeMinute: (index, minute) =>
        set((s) => {
          const next = { ...s.config };
          if (index === 1) next.driverChangeMinute1 = minute;
          else next.driverChangeMinute2 = minute;
          return { config: next };
        }),

      startRace: () => {
        const s = get();
        if (s.status !== "idle") return;
        const at = Date.now();
        const startedState: RaceState = {
          ...s,
          status: "running",
          startedAt: at,
          finishedAt: null,
          currentStint: 1,
          currentDriver: s.config.stintOrder[0],
          jokerLapDone: { 1: false, 2: false, 3: false },
          refuelsCompleted: 0,
          inPit: false,
          refuelInProgress: false,
          penaltySec: 0,
          events: [],
        };
        const ev = makeEvent(startedState, "race_start", { driver: s.config.stintOrder[0] }, at);
        set({ ...startedState, events: [ev] });
      },

      pitIn: (reason = "other") => {
        const s = get();
        if (s.status !== "running") return;
        const ev = makeEvent(s, "pit_in", { reason });
        set({ inPit: true, events: [...s.events, ev] });
      },

      driverChange: () => {
        const s = get();
        if (s.status !== "running") return { ok: false, reasons: ["Race not running."] };
        if (s.currentStint >= 3) {
          return { ok: false, reasons: ["No more stints — already on stint 3."] };
        }
        const nextStint = (s.currentStint + 1) as StintIndex;
        const nextDriver = s.config.stintOrder[nextStint - 1];
        const elapsed = elapsedNow(s, Date.now());
        const result = validateDriverChange(s, elapsed, nextDriver);
        if (!result.ok) return result;

        const ev = makeEvent(s, "driver_change", {
          from: s.currentDriver,
          to: nextDriver,
          stint: nextStint,
        });
        const events = [...s.events, ev];
        let penaltySec = s.penaltySec + result.penaltySec;
        if (result.penaltySec > 0) {
          const pev = makeEvent(
            s,
            "penalty",
            { seconds: result.penaltySec, note: result.reasons.join(" ") },
          );
          events.push(pev);
        }
        set({
          currentStint: nextStint,
          currentDriver: nextDriver,
          events,
          penaltySec,
        });
        return { ok: true, reasons: result.reasons };
      },

      refuelStart: () => {
        const s = get();
        if (s.status !== "running") return { ok: false, reasons: ["Race not running."] };
        if (s.refuelInProgress !== false) return { ok: false, reasons: ["Refuel already in progress."] };
        if (s.refuelsCompleted >= 2) return { ok: false, reasons: ["Both refuels already done."] };

        const elapsed = elapsedNow(s, Date.now());
        const result = validateRefuel(s, elapsed);
        if (!result.ok) return result;

        const idx = (s.refuelsCompleted + 1) as 1 | 2;
        const ev = makeEvent(s, "refuel_start", { index: idx });
        const events = [...s.events, ev];
        let penaltySec = s.penaltySec + result.penaltySec;
        if (result.penaltySec > 0) {
          const pev = makeEvent(s, "penalty", {
            seconds: result.penaltySec,
            note: result.reasons.join(" "),
          });
          events.push(pev);
        }
        set({
          inPit: true,
          refuelInProgress: idx,
          events,
          penaltySec,
        });
        return { ok: true, reasons: result.reasons };
      },

      refuelEnd: () => {
        const s = get();
        if (s.refuelInProgress === false) return;
        const idx = s.refuelInProgress;
        const ev = makeEvent(s, "refuel_end", { index: idx });
        set({
          refuelInProgress: false,
          refuelsCompleted: Math.min(2, s.refuelsCompleted + 1) as 0 | 1 | 2,
          events: [...s.events, ev],
        });
      },

      jokerLapDoneAction: () => {
        const s = get();
        if (s.status !== "running") return;
        if (s.jokerLapDone[s.currentStint]) return;
        const ev = makeEvent(s, "joker_lap_done", { stint: s.currentStint });
        set({
          jokerLapDone: { ...s.jokerLapDone, [s.currentStint]: true },
          events: [...s.events, ev],
        });
      },

      pitOut: () => {
        const s = get();
        if (!s.inPit) return;
        const ev = makeEvent(s, "pit_out");
        set({ inPit: false, events: [...s.events, ev] });
      },

      addPenalty: (seconds, note) => {
        const s = get();
        const ev = makeEvent(s, "penalty", { seconds, note });
        set({
          penaltySec: s.penaltySec + seconds,
          events: [...s.events, ev],
        });
      },

      addNote: (note) => {
        const s = get();
        const ev = makeEvent(s, "note", { note });
        set({ events: [...s.events, ev] });
      },

      finishRace: () => {
        const s = get();
        if (s.status !== "running") return;
        const at = Date.now();
        const ev = makeEvent(s, "race_finish", undefined, at);
        set({ status: "finished", finishedAt: at, events: [...s.events, ev] });
      },

      resetRace: () => {
        const s = get();
        set({ ...INITIAL_STATE, config: s.config });
      },
    }),
    {
      name: "kart-time-race",
      version: 1,
    },
  ),
);

export function elapsedFromState(state: Pick<RaceState, "status" | "startedAt" | "finishedAt">, now: number): number {
  if (!state.startedAt) return 0;
  if (state.status === "finished" && state.finishedAt) {
    return Math.max(0, Math.floor((state.finishedAt - state.startedAt) / 1000));
  }
  return Math.max(0, Math.floor((now - state.startedAt) / 1000));
}

export { OUTSIDE_WINDOW_PENALTY_SEC };
