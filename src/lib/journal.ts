import type { JournalSet, LastResult } from "./types";

/**
 * Most recent weighted result per exercise.
 * `sets` may be in any order. The latest day with a logged weight wins.
 */
export function computeHistory(sets: JournalSet[]): Record<string, LastResult> {
  const latestDay: Record<string, string> = {};
  for (const row of sets) {
    if (row.weight === null) continue;
    if (!latestDay[row.exercise_id] || row.performed_on > latestDay[row.exercise_id]) {
      latestDay[row.exercise_id] = row.performed_on;
    }
  }
  const result: Record<string, LastResult> = {};
  for (const row of sets) {
    if (row.weight === null || row.performed_on !== latestDay[row.exercise_id]) continue;
    const reached = row.target_reps_high !== null && row.reps >= row.target_reps_high;
    const current = result[row.exercise_id];
    result[row.exercise_id] = current
      ? { weight: Math.max(current.weight, Number(row.weight)), hit_top: current.hit_top && reached }
      : { weight: Number(row.weight), hit_top: reached };
  }
  return result;
}
