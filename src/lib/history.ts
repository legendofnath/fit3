import { EXERCISES_BY_ID } from "./exercises";
import { SPLITS_BY_ID } from "./splits";
import type { Goal, LastResult, Muscle, Role, Units } from "./types";

export interface LoggedSet {
  weight: number | null;
  reps: number;
}

export interface LoggedExercise {
  exercise_id: string;
  role?: Role;
  /** Planned rep range, used to decide whether to add weight next time. */
  reps: [number, number] | null;
  minutes: number | null;
  sets: LoggedSet[];
}

/** One finished workout, archived to the member's history. */
export interface WorkoutLog {
  id: string;
  /** YYYY-MM-DD, local date the workout was finished */
  date: string;
  started_at: number;
  finished_at: number;
  gym_id: string;
  gym_name: string;
  split?: string;
  day_index?: number;
  focus: string;
  goal: Goal;
  unit: Units;
  exercises: LoggedExercise[];
  kcal: number | null;
}

const DAY = 24 * 60 * 60 * 1000;

/** Rough metabolic equivalents for a resistance session by goal. */
const MET: Record<Goal, number> = { strength: 5, bodybuilding: 5, power: 4.5, weight_loss: 6 };

export function estimateKcal(goal: Goal, weightKg: number | null | undefined, minutes: number): number | null {
  if (!weightKg || minutes <= 0) return null;
  return Math.round(MET[goal] * weightKg * (minutes / 60));
}

/** Weight × reps, in the member's display unit. */
export function workoutVolume(log: WorkoutLog, unit: Units): number {
  const factor = log.unit === unit ? 1 : log.unit === "kg" ? 2.20462 : 1 / 2.20462;
  let total = 0;
  for (const ex of log.exercises) for (const s of ex.sets) total += (s.weight ?? 0) * s.reps * factor;
  return Math.round(total);
}

export function setCount(log: WorkoutLog): number {
  return log.exercises.reduce((n, ex) => n + (ex.minutes ? 0 : ex.sets.length), 0);
}

/** Last result per exercise, from the most recent workout that included it. */
export function lastResults(logs: WorkoutLog[]): Record<string, LastResult> {
  const out: Record<string, LastResult> = {};
  const sorted = [...logs].sort((a, b) => b.finished_at - a.finished_at);
  for (const log of sorted) {
    for (const ex of log.exercises) {
      if (out[ex.exercise_id]) continue;
      const weighted = ex.sets.filter((s) => s.weight !== null && s.weight > 0);
      if (!weighted.length) continue;
      const top = ex.reps?.[1];
      out[ex.exercise_id] = {
        weight: Math.max(...weighted.map((s) => s.weight as number)),
        hit_top: top !== undefined && ex.sets.length > 0 && ex.sets.every((s) => s.reps >= top),
      };
    }
  }
  return out;
}

/** Exercise ids from the last few workouts, most recent first. */
export function recentExercises(logs: WorkoutLog[], workouts = 3): string[] {
  return [...logs]
    .sort((a, b) => b.finished_at - a.finished_at)
    .slice(0, workouts)
    .flatMap((l) => l.exercises.map((e) => e.exercise_id));
}

/** Hours since each muscle was last trained as a main muscle. */
export function hoursSinceTrained(logs: WorkoutLog[], now: number): Partial<Record<Muscle, number>> {
  const out: Partial<Record<Muscle, number>> = {};
  for (const log of logs) {
    for (const ex of log.exercises) {
      const def = EXERCISES_BY_ID[ex.exercise_id];
      if (!def || !ex.sets.length || def.kind === "cardio") continue;
      const hours = (now - log.finished_at) / 3600000;
      if (out[def.muscle] === undefined || hours < (out[def.muscle] as number)) out[def.muscle] = hours;
    }
  }
  return out;
}

/** Hard sets per muscle in the last 7 days. Secondary muscles count as half a set. */
export function weeklySets(logs: WorkoutLog[], now: number): Record<Muscle, number> {
  const out = {
    chest: 0, back: 0, shoulders: 0, biceps: 0, triceps: 0, quads: 0,
    hamstrings: 0, glutes: 0, calves: 0, core: 0, cardio: 0,
  } as Record<Muscle, number>;
  for (const log of logs) {
    if (now - log.finished_at > 7 * DAY) continue;
    for (const ex of log.exercises) {
      const def = EXERCISES_BY_ID[ex.exercise_id];
      if (!def || def.kind === "cardio") continue;
      out[def.muscle] += ex.sets.length;
      for (const m of def.secondary) out[m] += ex.sets.length / 2;
    }
  }
  return out;
}

/** Weekly hard-set range commonly recommended per muscle for each goal. */
export const WEEKLY_TARGET: Record<Goal, [number, number]> = {
  bodybuilding: [10, 20],
  strength: [6, 12],
  power: [6, 10],
  weight_loss: [6, 12],
};

export interface Stats {
  workoutsThisWeek: number;
  daysLast30: number;
  volumeLast30: number;
  kcalLast30: number;
  setsLast30: number;
  streakWeeks: number;
  minutesLast30: number;
}

function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export function computeStats(logs: WorkoutLog[], unit: Units, now: number): Stats {
  const weekStart = startOfWeek(now);
  const recent = logs.filter((l) => now - l.finished_at <= 30 * DAY);
  // Consecutive weeks, ending this week or last, with at least one workout.
  const weeks = new Set(logs.map((l) => startOfWeek(l.finished_at)));
  let streak = 0;
  let cursor = weeks.has(weekStart) ? weekStart : startOfWeek(weekStart - DAY);
  while (weeks.has(cursor)) {
    streak++;
    cursor = startOfWeek(cursor - DAY);
  }
  return {
    workoutsThisWeek: logs.filter((l) => l.finished_at >= weekStart).length,
    daysLast30: new Set(recent.map((l) => l.date)).size,
    volumeLast30: recent.reduce((sum, l) => sum + workoutVolume(l, unit), 0),
    kcalLast30: recent.reduce((sum, l) => sum + (l.kcal ?? 0), 0),
    setsLast30: recent.reduce((sum, l) => sum + setCount(l), 0),
    streakWeeks: streak,
    minutesLast30: recent.reduce((sum, l) => sum + Math.round((l.finished_at - l.started_at) / 60000), 0),
  };
}

const RECOVERY_HOURS = 48;

export interface Recommendation {
  dayIndex: number;
  reason: string;
}

/**
 * Which day of the split to train next: the next day in the rotation,
 * unless its muscles were trained in the last 48 hours and a later day is fresher.
 */
export function recommendDay(splitId: string, logs: WorkoutLog[], now: number): Recommendation {
  const split = SPLITS_BY_ID[splitId];
  if (!split) return { dayIndex: 0, reason: "" };
  const own = [...logs].filter((l) => l.split === splitId).sort((a, b) => b.finished_at - a.finished_at);
  const next = own.length ? ((own[0].day_index ?? -1) + 1) % split.days.length : 0;
  const since = hoursSinceTrained(logs, now);
  const tired = (i: number) =>
    split.days[i].muscles.filter((m) => since[m] !== undefined && (since[m] as number) < RECOVERY_HOURS);

  if (!logs.length) {
    return { dayIndex: 0, reason: `First session of ${split.name}. Start with ${split.days[0].name}.` };
  }
  const nextTired = tired(next);
  if (!nextTired.length) {
    const last = own[0] ? `You last did ${split.days[own[0].day_index ?? 0].name}. ` : "";
    return { dayIndex: next, reason: `${last}${split.days[next].name} is next, and those muscles are rested.` };
  }
  for (let step = 1; step < split.days.length; step++) {
    const i = (next + step) % split.days.length;
    if (!tired(i).length) {
      return {
        dayIndex: i,
        reason: `${split.days[next].name} would hit ${nextTired.join(" and ")} again within two days, so ${split.days[i].name} comes first.`,
      };
    }
  }
  return {
    dayIndex: next,
    reason: `${split.days[next].name} is next. You trained ${nextTired.join(" and ")} in the last two days, so go lighter or take a rest day.`,
  };
}

/** YYYY-MM-DD in local time. */
export function localDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
