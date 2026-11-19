"use client";

import { useSyncExternalStore } from "react";
import { SEEDED_GYMS, resolveEquipment, type EquipmentEdits, type GymInfo } from "./gyms";
import type { WorkoutLog } from "./history";
import type { AvoidTag, Goal, PlanDay, Units } from "./types";

export interface Body {
  age: number | null;
  sex: "female" | "male" | "unspecified";
  /** centimetres */
  height_cm: number | null;
  /** kilograms */
  weight_kg: number | null;
}

export interface Preferences {
  goal: Goal;
  experience: 1 | 2 | 3;
  days_per_week: number;
  session_minutes: number;
  avoid: AvoidTag[];
  units: Units;
  /** Training split id; a default is picked from days per week and goal when unset. */
  split?: string;
}

export interface State {
  /** False during server render and the first client paint. */
  hydrated: boolean;
  body: Body | null;
  prefs: Preferences | null;
  gymId: string | null;
  customGyms: GymInfo[];
  edits: Record<string, EquipmentEdits>;
  /** The most recently generated workout, so it survives moving between screens. */
  session: Session | null;
  /** Finished workouts, newest first. */
  log: WorkoutLog[];
}

export interface SetEntry {
  weight: string;
  reps: string;
  done: boolean;
}

export interface Session {
  day: PlanDay;
  gymId: string;
  goal: Goal;
  minutes: number;
  /** "HH:MM" */
  start: string;
  /** Sets entered so far, per exercise id. */
  entries?: Record<string, SetEntry[]>;
  /** When the first set was ticked. */
  started_at?: number | null;
}

// Kept in the browser for now. Accounts and a database replace this in a later step.
const KEY = "fit3.state.v1";
const SERVER: State = { hydrated: false, body: null, prefs: null, gymId: null, customGyms: [], edits: {}, session: null, log: [] };

let state: State | null = null;
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...SERVER, ...(JSON.parse(raw) as Partial<State>), hydrated: true };
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return { ...SERVER, hydrated: true };
}

function snapshot(): State {
  if (!state) state = load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function update(change: (current: State) => Partial<State>) {
  const next = { ...snapshot(), ...change(snapshot()) };
  state = next;
  try {
    const { hydrated: _ignored, ...saved } = next;
    void _ignored;
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Nothing else to do; the app keeps working for this visit.
  }
  listeners.forEach((listener) => listener());
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore.
  }
  state = { ...SERVER, hydrated: true };
  listeners.forEach((listener) => listener());
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, snapshot, () => SERVER);
}

export function allGyms(s: State): GymInfo[] {
  return [...SEEDED_GYMS, ...s.customGyms];
}

export function currentGym(s: State): GymInfo | null {
  return allGyms(s).find((g) => g.id === s.gymId) ?? null;
}

export function gymEquipment(s: State, gym: GymInfo) {
  return resolveEquipment(gym, s.edits[gym.id]);
}

export function toggleEquipment(gymId: string, equipmentId: string, present: boolean) {
  update((s) => {
    const current = s.edits[gymId] ?? { added: [], removed: [] };
    const added = new Set(current.added);
    const removed = new Set(current.removed);
    if (present) {
      removed.delete(equipmentId);
      added.add(equipmentId);
    } else {
      added.delete(equipmentId);
      removed.add(equipmentId);
    }
    return { edits: { ...s.edits, [gymId]: { added: [...added], removed: [...removed] } } };
  });
}

/** Unit helpers: the store keeps metric, the screens show the member's units. */
export const kgToLb = (kg: number) => Math.round(kg * 2.20462);
export const lbToKg = (lb: number) => lb / 2.20462;
export const cmToFtIn = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return { ft: Math.floor(inches / 12), in: inches % 12 };
};
export const ftInToCm = (ft: number, inches: number) => (ft * 12 + inches) * 2.54;
