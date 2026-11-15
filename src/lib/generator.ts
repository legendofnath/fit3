import { EXERCISES, EXERCISES_BY_ID } from "./exercises";
import type {
  AvoidTag,
  Exercise,
  Goal,
  Kind,
  LastResult,
  Muscle,
  PlanDay,
  PlanExercise,
  Units,
  WeekPlan,
} from "./types";

/** What the generator needs to know about the member. */
export interface GeneratorProfile {
  goal: Goal;
  experience: 1 | 2 | 3;
  days_per_week: number;
  session_minutes: number;
  avoid: AvoidTag[];
  units: Units;
}

interface Slot {
  muscles: Muscle[];
  kind: Kind;
}

const s = (kind: Kind, ...muscles: Muscle[]): Slot => ({ muscles, kind });

// Slots are listed in priority order. Shorter sessions use fewer of them.
const TEMPLATES: Record<string, Slot[]> = {
  "Full body A": [
    s("compound", "quads"),
    s("compound", "chest"),
    s("compound", "back"),
    s("compound", "hamstrings", "glutes"),
    s("compound", "shoulders"),
    s("isolation", "core"),
    s("isolation", "biceps"),
    s("isolation", "triceps"),
    s("isolation", "calves"),
  ],
  "Full body B": [
    s("compound", "hamstrings", "glutes"),
    s("compound", "back"),
    s("compound", "chest"),
    s("compound", "quads"),
    s("isolation", "shoulders"),
    s("isolation", "core"),
    s("isolation", "triceps"),
    s("isolation", "biceps"),
    s("isolation", "calves"),
  ],
  Upper: [
    s("compound", "chest"),
    s("compound", "back"),
    s("compound", "shoulders"),
    s("compound", "back"),
    s("isolation", "chest"),
    s("isolation", "biceps"),
    s("isolation", "triceps"),
    s("isolation", "shoulders"),
  ],
  Lower: [
    s("compound", "quads"),
    s("compound", "hamstrings", "glutes"),
    s("compound", "quads"),
    s("isolation", "hamstrings", "glutes"),
    s("isolation", "quads"),
    s("isolation", "calves"),
    s("isolation", "core"),
  ],
  Push: [
    s("compound", "chest"),
    s("compound", "shoulders"),
    s("compound", "chest"),
    s("isolation", "shoulders"),
    s("isolation", "triceps"),
    s("isolation", "chest"),
    s("isolation", "triceps"),
  ],
  Pull: [
    s("compound", "back"),
    s("compound", "back"),
    s("compound", "hamstrings", "glutes"),
    s("isolation", "shoulders"),
    s("isolation", "biceps"),
    s("isolation", "back"),
    s("isolation", "biceps"),
    s("isolation", "core"),
  ],
};
TEMPLATES.Legs = TEMPLATES.Lower;

const SPLITS: Record<number, string[]> = {
  1: ["Full body A"],
  2: ["Full body A", "Full body B"],
  3: ["Full body A", "Full body B", "Full body A"],
  4: ["Upper", "Lower", "Upper", "Lower"],
  5: ["Push", "Pull", "Legs", "Upper", "Lower"],
  6: ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
};

interface Scheme {
  sets: number;
  reps: [number, number];
  rest: number;
}

const PRESETS: Record<Goal, { compound: Scheme; isolation: Scheme; cardioMinutes: number }> = {
  power: {
    compound: { sets: 5, reps: [2, 5], rest: 180 },
    isolation: { sets: 3, reps: [6, 8], rest: 90 },
    cardioMinutes: 0,
  },
  strength: {
    compound: { sets: 4, reps: [4, 6], rest: 150 },
    isolation: { sets: 3, reps: [8, 10], rest: 75 },
    cardioMinutes: 0,
  },
  bodybuilding: {
    compound: { sets: 4, reps: [8, 12], rest: 90 },
    isolation: { sets: 3, reps: [10, 15], rest: 60 },
    cardioMinutes: 0,
  },
  weight_loss: {
    compound: { sets: 3, reps: [12, 15], rest: 45 },
    isolation: { sets: 2, reps: [12, 15], rest: 30 },
    cardioMinutes: 10,
  },
};

const WARMUP_SECONDS = 5 * 60;
const SECONDS_PER_SET = 45;
const SETUP_SECONDS = 60;
const MIN_EXERCISES = 3;

/** Small deterministic hash so the same member gets a stable week, and a different one next week. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** True when the exercise can be done by this member with this equipment. */
export function isUsable(
  ex: Exercise,
  available: ReadonlySet<string>,
  profile: Pick<GeneratorProfile, "experience" | "avoid">,
): boolean {
  if (ex.difficulty > profile.experience) return false;
  if (ex.avoid.some((tag) => profile.avoid.includes(tag))) return false;
  return ex.requires.every((item) => available.has(item));
}

function scheme(goal: Goal, kind: Kind): Scheme {
  const preset = PRESETS[goal];
  return kind === "compound" ? preset.compound : preset.isolation;
}

function seconds(sc: Scheme): number {
  return sc.sets * (SECONDS_PER_SET + sc.rest) + SETUP_SECONDS;
}

/** Target weight for the next session, from the last logged result. */
export function nextTarget(last: LastResult | undefined, units: Units): number | null {
  if (!last) return null;
  const step = units === "lb" ? 5 : 2.5;
  return last.hit_top ? last.weight + step : last.weight;
}

function toPlanExercise(
  ex: Exercise,
  goal: Goal,
  units: Units,
  history: Record<string, LastResult>,
): PlanExercise {
  if (ex.kind === "cardio") {
    return {
      exercise_id: ex.id,
      sets: 1,
      reps: null,
      minutes: PRESETS[goal].cardioMinutes || 10,
      rest_seconds: 0,
      target_weight: null,
    };
  }
  const sc = scheme(goal, ex.kind);
  return {
    exercise_id: ex.id,
    sets: sc.sets,
    reps: sc.reps,
    minutes: null,
    rest_seconds: sc.rest,
    target_weight: ex.requires.length ? nextTarget(history[ex.id], units) : null,
  };
}

function pick(
  candidates: Exercise[],
  used: Map<string, number>,
  inDay: Set<string>,
  seed: string,
): Exercise | undefined {
  let best: Exercise | undefined;
  let bestScore = Infinity;
  for (const ex of candidates) {
    if (inDay.has(ex.id)) continue;
    // Prefer exercises not yet used this week, then harder ones, then a stable shuffle.
    // Bodyweight moves are a fallback when loaded options exist.
    const score =
      (used.get(ex.id) ?? 0) * 10 +
      (ex.requires.length === 0 ? 3 : 0) -
      ex.difficulty * 0.5 +
      hash(seed + ex.id);
    if (score < bestScore) {
      bestScore = score;
      best = ex;
    }
  }
  return best;
}

/**
 * Build a week of workouts using only equipment in `available`.
 * `seed` should change week to week (for example user id plus week start date).
 */
export function generateWeek(
  profile: GeneratorProfile,
  available: ReadonlySet<string>,
  history: Record<string, LastResult> = {},
  seed = "",
): WeekPlan {
  const days = Math.min(6, Math.max(1, Math.round(profile.days_per_week)));
  const usable = EXERCISES.filter((ex) => isUsable(ex, available, profile));
  const used = new Map<string, number>();
  const preset = PRESETS[profile.goal];
  const budget =
    profile.session_minutes * 60 - WARMUP_SECONDS - preset.cardioMinutes * 60;

  const planDays: PlanDay[] = SPLITS[days].map((focus, dayIndex) => {
    const inDay = new Set<string>();
    const exercises: PlanExercise[] = [];
    let spent = 0;

    for (const slot of TEMPLATES[focus]) {
      const sc = scheme(profile.goal, slot.kind);
      const cost = seconds(sc);
      if (exercises.length >= MIN_EXERCISES && spent + cost > budget) break;

      const inMuscle = usable.filter(
        (ex) => ex.kind !== "cardio" && slot.muscles.includes(ex.muscle),
      );
      const sameKind = inMuscle.filter((ex) => ex.kind === slot.kind);
      // If nothing of the wanted kind is possible, accept any exercise for that muscle.
      const chosen =
        pick(sameKind, used, inDay, `${seed}:${dayIndex}`) ??
        pick(inMuscle, used, inDay, `${seed}:${dayIndex}`);
      if (!chosen) continue;

      inDay.add(chosen.id);
      used.set(chosen.id, (used.get(chosen.id) ?? 0) + 1);
      exercises.push(toPlanExercise(chosen, profile.goal, profile.units, history));
      spent += seconds(scheme(profile.goal, chosen.kind));
    }

    // A day that came out too thin (little equipment, narrow focus) is topped up
    // with whatever else the member can do, so no session is under three exercises.
    while (exercises.length < MIN_EXERCISES) {
      const extra = pick(
        usable.filter((ex) => ex.kind !== "cardio"),
        used,
        inDay,
        `${seed}:${dayIndex}`,
      );
      if (!extra) break;
      inDay.add(extra.id);
      used.set(extra.id, (used.get(extra.id) ?? 0) + 1);
      exercises.push(toPlanExercise(extra, profile.goal, profile.units, history));
    }

    // Short sessions with long rests can still overrun; trim sets until they fit.
    const length = () =>
      exercises.reduce((sum, it) => sum + it.sets * (SECONDS_PER_SET + it.rest_seconds) + SETUP_SECONDS, 0);
    while (length() > budget && exercises.some((it) => it.sets > 2)) {
      const longest = exercises.reduce((a, b) => (b.sets > a.sets ? b : a));
      longest.sets -= 1;
    }

    if (preset.cardioMinutes > 0) {
      const cardio = pick(
        usable.filter((ex) => ex.kind === "cardio"),
        used,
        inDay,
        `${seed}:${dayIndex}`,
      );
      if (cardio) {
        used.set(cardio.id, (used.get(cardio.id) ?? 0) + 1);
        exercises.push(toPlanExercise(cardio, profile.goal, profile.units, history));
      }
    }

    return { focus, exercises };
  });

  return { goal: profile.goal, units: profile.units, days: planDays };
}

/** Exercise ids in the plan that cannot be done with `available`. Empty means the plan is valid. */
export function validatePlan(plan: WeekPlan, available: ReadonlySet<string>): string[] {
  const bad: string[] = [];
  for (const day of plan.days) {
    for (const item of day.exercises) {
      const ex = EXERCISES_BY_ID[item.exercise_id];
      if (!ex || !ex.requires.every((r) => available.has(r))) bad.push(item.exercise_id);
    }
  }
  return bad;
}

/**
 * Find a replacement for one exercise in a day.
 * `available` should already exclude any equipment that is taken or missing.
 * Returns null when nothing suitable exists.
 */
export function findSubstitute(
  day: PlanDay,
  exerciseId: string,
  available: ReadonlySet<string>,
  profile: GeneratorProfile,
  history: Record<string, LastResult> = {},
  seed = "",
): PlanExercise | null {
  const original = EXERCISES_BY_ID[exerciseId];
  if (!original) return null;
  const inDay = new Set(day.exercises.map((item) => item.exercise_id));
  const pool = EXERCISES.filter(
    (ex) => ex.id !== exerciseId && ex.muscle === original.muscle && isUsable(ex, available, profile),
  );
  const tiers = [
    pool.filter((ex) => ex.kind === original.kind && ex.movement === original.movement),
    pool.filter((ex) => ex.kind === original.kind),
    pool,
  ];
  for (const tier of tiers) {
    const chosen = pick(tier, new Map(), inDay, seed + exerciseId);
    if (chosen) {
      return {
        ...toPlanExercise(chosen, profile.goal, profile.units, history),
        swapped_from: exerciseId,
      };
    }
  }
  return null;
}

/** Re-check a plan after the gym's equipment changed, replacing anything no longer possible. */
export function repairPlan(
  plan: WeekPlan,
  available: ReadonlySet<string>,
  profile: GeneratorProfile,
  history: Record<string, LastResult> = {},
  seed = "",
): WeekPlan {
  return {
    ...plan,
    days: plan.days.map((day) => {
      let current = day;
      for (const item of day.exercises) {
        const ex = EXERCISES_BY_ID[item.exercise_id];
        if (ex && ex.requires.every((r) => available.has(r))) continue;
        const sub = findSubstitute(current, item.exercise_id, available, profile, history, seed);
        current = {
          ...current,
          exercises: sub
            ? current.exercises.map((it) => (it.exercise_id === item.exercise_id ? sub : it))
            : current.exercises.filter((it) => it.exercise_id !== item.exercise_id),
        };
      }
      return current;
    }),
  };
}

/** Rough length of a day in minutes, including warm-up. */
export function estimateMinutes(day: PlanDay): number {
  let total = WARMUP_SECONDS;
  for (const item of day.exercises) {
    total += item.minutes
      ? item.minutes * 60
      : item.sets * (SECONDS_PER_SET + item.rest_seconds) + SETUP_SECONDS;
  }
  return Math.round(total / 60);
}
