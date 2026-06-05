export type DriverId = string;

export type StintIndex = 1 | 2 | 3;

export type RaceStatus = "idle" | "running" | "finished";

export type TeamNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type WindowKind = "driver_change_1" | "refuel_1" | "driver_change_2" | "refuel_2";

export type WindowState =
  | "upcoming"
  | "opening_soon"
  | "open"
  | "closed_ok"
  | "missed";

export interface RaceWindow {
  kind: WindowKind;
  label: string;
  openSec: number;
  closeSec: number;
}

export type EventType =
  | "race_start"
  | "pit_in"
  | "driver_change"
  | "refuel_start"
  | "refuel_end"
  | "joker_lap_done"
  | "pit_out"
  | "penalty"
  | "race_finish"
  | "note";

export interface RaceEvent {
  id: string;
  type: EventType;
  at: number;
  elapsedSec: number;
  data?: Record<string, string | number | boolean | undefined>;
}

export interface Driver {
  id: DriverId;
  name: string;
}

export interface RaceConfig {
  teamNumber: TeamNumber;
  drivers: Driver[];
  stintOrder: [DriverId, DriverId, DriverId];
  raceDurationSec: number;
  /** Optional briefing-assigned stop minute for driver change 1. If unset, window is 18-20. */
  driverChangeMinute1?: number;
  /** Optional briefing-assigned stop minute for driver change 2. If unset, window is 38-40. */
  driverChangeMinute2?: number;
}

export interface RaceState {
  config: RaceConfig;
  status: RaceStatus;
  startedAt: number | null;
  finishedAt: number | null;
  currentStint: StintIndex;
  currentDriver: DriverId;
  jokerLapDone: Record<StintIndex, boolean>;
  refuelsCompleted: 0 | 1 | 2;
  inPit: boolean;
  refuelInProgress: false | 1 | 2;
  penaltySec: number;
  events: RaceEvent[];
}

export interface ValidationResult {
  ok: boolean;
  reasons: string[];
  penaltySec: number;
}
