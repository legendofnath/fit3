import { EXERCISES, EXERCISES_BY_ID } from "./exercises";
import { SPLITS_BY_ID, type Slot, type SplitDay, type Style } from "./splits";
import type {
  AvoidTag,
  Exercise,
  Goal,
  LastResult,
  PlanDay,
  PlanExercise,
  Role,
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

/** What the generator knows about recent training. */
export interface GeneratorContext {
  /** Last logged result per exercise, for target weights. */
  history?: Record<string, LastResult>;
  /** Exercise ids used in recent sessions, most recent first. Repeats are penalised. */
  recent?: string[];
  /** Changes tie-breaks between equally good choices. */
  seed?: string;
}

interface Scheme {
  sets: number;
  reps: [number, number];
  rest: number;
}

/** Sets, reps and rest by training style and the exercise's role in the session. */
export const PRESCRIPTION: Record<Style, Record<Exclude<Role, "finisher">, Scheme>> = {
  power: {
    main: { sets: 5, reps: [2, 4], rest: 180 },
    secondary: { sets: 4, reps: [4, 6], rest: 150 },
    accessory: { sets: 3, reps: [8, 12], rest: 75 },
  },
  strength: {
    main: { sets: 4, reps: [3, 6], rest: 180 },
    secondary: { sets: 3, reps: [6, 8], rest: 120 },
    accessory: { sets: 3, reps: [8, 12], rest: 75 },
  },
  hypertrophy: {
    main: { sets: 4, reps: [6, 10], rest: 120 },
    secondary: { sets: 3, reps: [8, 12], rest: 90 },
    accessory: { sets: 3, reps: [10, 15], rest: 60 },
  },
  conditioning: {
    main: { sets: 3, reps: [8, 12], rest: 75 },
    secondary: { sets: 3, reps: [10, 15], rest: 60 },
    accessory: { sets: 2, reps: [12, 20], rest: 45 },
  },
};

export const STYLE_FOR_GOAL: Record<Goal, Style> = {
  power: "power",
  strength: "strength",
  bodybuilding: "hypertrophy",
  weight_loss: "conditioning",
};

const WARMUP_SECONDS = 5 * 60;
const SECONDS_PER_SET = 45;
const SETUP_SECONDS = 60;
const MIN_EXERCISES = 3;
const FINISHER_MINUTES = 10;

/** Small deterministic hash in [0, 1), so the same seed gives the same session. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
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

/** Target weight for the next session, from the last logged result. */
export function nextTarget(last: LastResult | undefined, units: Units): number | null {
  if (!last) return null;
  const step = units === "lb" ? 5 : 2.5;
  return last.hit_top ? last.weight + step : last.weight;
}

/** Reps limited to what the exercise suits. */
function fitReps(wanted: [number, number], ex: Exercise): [number, number] {
  const [lo, hi] = wanted;
  const [exLo, exHi] = ex.repRange;
  const a = Math.max(lo, exLo);
  const b = Math.min(hi, exHi);
  if (a <= b) return [a, b];
  return exHi < lo ? [Math.max(exLo, exHi - 4), exHi] : [exLo, Math.min(exHi, exLo + 4)];
}

function prescribe(
  ex: Exercise,
  role: Role,
  style: Style,
  units: Units,
  history: Record<string, LastResult>,
  fixed?: Slot["scheme"],
): PlanExercise {
  if (ex.kind === "cardio" || role === "finisher") {
    return {
      exercise_id: ex.id,
      role: "finisher",
      sets: 1,
      reps: null,
      minutes: style === "conditioning" ? 12 : FINISHER_MINUTES,
      rest_seconds: 0,
      target_weight: null,
    };
  }
  const base = PRESCRIPTION[style][role];
  return {
    exercise_id: ex.id,
    role,
    sets: fixed?.sets ?? base.sets,
    reps: fixed ? fixed.reps : fitReps(base.reps, ex),
    minutes: null,
    rest_seconds: base.rest,
    target_weight: ex.requires.length ? nextTarget(history[ex.id], units) : null,
  };
}

function itemSeconds(item: PlanExercise): number {
  return item.minutes ? item.minutes * 60 : item.sets * (SECONDS_PER_SET + item.rest_seconds) + SETUP_SECONDS;
}

/** Exercises a slot may use, before scoring. */
function candidates(slot: Slot, usable: Exercise[]): Exercise[] {
  if (slot.role === "finisher") return usable.filter((ex) => ex.kind === "cardio");
  const fits = (ex: Exercise, strict: boolean) =>
    ex.kind !== "cardio" &&
    (!slot.muscles || slot.muscles.includes(ex.muscle)) &&
    (!strict || !slot.patterns || slot.patterns.includes(ex.pattern));
  const strict = usable.filter((ex) => fits(ex, true));
  // If the gym cannot do the pattern, fall back to anything for the same muscles.
  return strict.length || !slot.muscles ? strict : usable.filter((ex) => fits(ex, false));
}

const TIER_FIT: Record<Exclude<Role, "finisher">, Record<Exercise["tier"], number>> = {
  main: { main: 4, secondary: 1, accessory: -6 },
  secondary: { main: 1, secondary: 3, accessory: -2 },
  accessory: { main: -4, secondary: 1, accessory: 3 },
};

/**
 * Score one exercise for one slot. Higher is better.
 * Staple choices and the right tier dominate; recent repeats, fatigue stacking and
 * poor rep-range fit are penalised; the seeded hash only breaks near-ties.
 */
export function scoreExercise(
  ex: Exercise,
  slot: Slot,
  style: Style,
  day: Exercise[],
  profile: Pick<GeneratorProfile, "experience">,
  recent: string[],
  seed: string,
): number {
  let score = ex.staple * 2;
  if (slot.role !== "finisher") {
    score += TIER_FIT[slot.role][ex.tier];
    const [lo, hi] = slot.scheme?.reps ?? PRESCRIPTION[style][slot.role].reps;
    const overlap = Math.min(hi, ex.repRange[1]) - Math.max(lo, ex.repRange[0]);
    if (overlap < 0) score -= 4;
    // Reward exercises that suit the whole wanted rep range, not just its edge.
    else score += 1.5 * (hi > lo ? overlap / (hi - lo) : 1);
  }
  const preferIndex = slot.prefer?.indexOf(ex.id) ?? -1;
  if (preferIndex >= 0) score += 10 - preferIndex;

  // Recently used: lose points so sessions rotate through good options.
  const uses = recent.filter((id) => id === ex.id).length;
  score -= uses * 2.5;

  // Two very draining lifts in one session is rarely a good idea.
  if (ex.fatigue === 3 && day.some((d) => d.fatigue === 3) && preferIndex < 0) score -= 7;
  if (ex.fatigue === 3 && profile.experience === 1) score -= 2;

  // Spread the session across equipment rather than queueing at one station.
  const mainKit = ex.requires.at(-1);
  if (mainKit && day.filter((d) => d.requires.at(-1) === mainKit).length >= 1) score -= 1.5;

  // Do not train the same pattern twice at the same tier in one session.
  if (day.some((d) => d.pattern === ex.pattern && d.muscle === ex.muscle && d.tier === ex.tier && ex.pattern !== "isolation")) score -= 1;

  return score + hash(seed + ex.id) * 1.5;
}

const ROLE_ORDER: Record<Role, number> = { main: 0, secondary: 1, accessory: 2, finisher: 3 };

/** Build one split day. */
export function generateSplitDay(
  profile: GeneratorProfile,
  available: ReadonlySet<string>,
  splitId: string,
  dayIndex: number,
  ctx: GeneratorContext = {},
): PlanDay {
  const split = SPLITS_BY_ID[splitId] ?? SPLITS_BY_ID.full_body;
  const index = ((dayIndex % split.days.length) + split.days.length) % split.days.length;
  const day = split.days[index];
  const plan = buildDay(day, profile, available, ctx);
  return { ...plan, split: split.id, day_index: index };
}

function buildDay(
  template: SplitDay,
  profile: GeneratorProfile,
  available: ReadonlySet<string>,
  ctx: GeneratorContext,
): PlanDay {
  const style = template.style ?? STYLE_FOR_GOAL[profile.goal];
  const usable = EXERCISES.filter((ex) => isUsable(ex, available, profile));
  const recent = ctx.recent ?? [];
  const history = ctx.history ?? {};
  const seed = `${ctx.seed ?? ""}:${template.name}`;

  const chosen: Exercise[] = [];
  const items: PlanExercise[] = [];
  const slots = [...template.slots];
  // Weight loss gets a cardio finisher on every day.
  if (profile.goal === "weight_loss" && !slots.some((s) => s.role === "finisher")) slots.push({ role: "finisher" });

  for (const slot of slots) {
    const pool = candidates(slot, usable).filter((ex) => !chosen.includes(ex));
    if (!pool.length) continue;
    let best = pool[0];
    let bestScore = -Infinity;
    for (const ex of pool) {
      const s = scoreExercise(ex, slot, style, chosen, profile, recent, seed);
      if (s > bestScore) {
        bestScore = s;
        best = ex;
      }
    }
    chosen.push(best);
    items.push(prescribe(best, slot.role, style, profile.units, history, slot.scheme));
  }

  // Too little equipment for the template: top up with whatever is possible.
  while (items.filter((i) => i.role !== "finisher").length < MIN_EXERCISES) {
    const extra = usable
      .filter((ex) => ex.kind !== "cardio" && !chosen.includes(ex))
      .sort((a, b) => b.staple - a.staple || hash(seed + a.id) - hash(seed + b.id))[0];
    if (!extra) break;
    chosen.push(extra);
    items.push(prescribe(extra, "accessory", style, profile.units, history));
  }

  const fixed = new Set(items.filter((_, i) => slots[i]?.scheme).map((it) => it.exercise_id));
  fitToTime(items, profile.session_minutes * 60 - WARMUP_SECONDS, fixed);
  items.sort((a, b) => ROLE_ORDER[a.role ?? "accessory"] - ROLE_ORDER[b.role ?? "accessory"]);
  return { focus: template.name, exercises: items };
}

/**
 * Make a session fit its time. In order: drop accessories down to two, trim
 * sets (accessories, then secondary lifts, then main lifts to three), drop the
 * remaining accessories, shorten then drop the finisher, then drop secondary
 * lifts. Main lifts are never removed; in very short sessions they drop to two sets.
 */
function fitToTime(items: PlanExercise[], budget: number, fixed: Set<string>) {
  const total = () => items.reduce((sum, it) => sum + itemSeconds(it), 0);
  const lifts = () => items.filter((i) => i.role !== "finisher").length;
  const count = (role: Role) => items.filter((i) => i.role === role).length;
  const dropLast = (test: (i: PlanExercise) => boolean) => {
    const idx = findLastIndex(items, test);
    if (idx < 0) return false;
    items.splice(idx, 1);
    return true;
  };

  while (total() > budget && count("accessory") > 2 && lifts() > MIN_EXERCISES) dropLast((i) => i.role === "accessory");
  for (const [role, floor] of [["accessory", 2], ["secondary", 2], ["main", 3]] as const) {
    while (total() > budget) {
      const target = items
        .filter((i) => i.role === role && i.sets > floor && !fixed.has(i.exercise_id))
        .sort((a, b) => b.sets - a.sets)[0];
      if (!target) break;
      target.sets -= 1;
    }
  }
  while (total() > budget && lifts() > MIN_EXERCISES && dropLast((i) => i.role === "accessory"));
  while (total() > budget) {
    const item = items.find((i) => i.role === "finisher");
    if (!item) break;
    if (item.minutes && item.minutes > 5) item.minutes -= 5;
    else items.splice(items.indexOf(item), 1);
  }
  while (total() > budget && lifts() > MIN_EXERCISES && dropLast((i) => i.role === "secondary" && !fixed.has(i.exercise_id)));
  // Last resort for very short sessions: heavy lifts, fixed programs included, drop to two sets.
  while (total() > budget) {
    const target = items.filter((i) => i.role !== "finisher" && i.sets > 2).sort((a, b) => b.sets - a.sets)[0];
    if (!target) break;
    target.sets -= 1;
  }
}

function findLastIndex<T>(list: T[], test: (item: T) => boolean): number {
  for (let i = list.length - 1; i >= 0; i--) if (test(list[i])) return i;
  return -1;
}

/** Build a whole week of a split, rotating days and avoiding repeats across the week. */
export function generateWeek(
  profile: GeneratorProfile,
  available: ReadonlySet<string>,
  splitId: string,
  ctx: GeneratorContext = {},
): WeekPlan {
  const days = Math.min(6, Math.max(1, Math.round(profile.days_per_week)));
  const recent = [...(ctx.recent ?? [])];
  const out: PlanDay[] = [];
  for (let i = 0; i < days; i++) {
    const day = generateSplitDay(profile, available, splitId, i, { ...ctx, recent });
    recent.unshift(...day.exercises.map((e) => e.exercise_id));
    out.push(day);
  }
  return { goal: profile.goal, units: profile.units, days: out };
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
 * `available` should already exclude the equipment that is taken or missing.
 * Prefers the same pattern and muscle, then the same muscle. Returns null when nothing fits.
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
  const current = day.exercises.find((e) => e.exercise_id === exerciseId);
  if (!original || !current) return null;
  const inDay = new Set(day.exercises.map((item) => item.exercise_id));
  const pool = EXERCISES.filter(
    (ex) => !inDay.has(ex.id) && ex.muscle === original.muscle && isUsable(ex, available, profile),
  );
  const tiers = [
    pool.filter((ex) => ex.pattern === original.pattern && ex.kind === original.kind),
    pool.filter((ex) => ex.kind === original.kind),
    pool,
  ];
  const role = current.role ?? "accessory";
  const style: Style = current.reps && current.reps[1] <= 4 ? "power" : STYLE_FOR_GOAL[profile.goal];
  for (const tier of tiers) {
    if (!tier.length) continue;
    const slot: Slot = { role };
    const best = tier
      .map((ex) => ({ ex, s: scoreExercise(ex, slot, style, [], profile, [], seed) }))
      .sort((a, b) => b.s - a.s)[0].ex;
    return {
      ...prescribe(best, role, style, profile.units, history),
      sets: current.sets,
      rest_seconds: current.rest_seconds,
      reps: best.kind === "cardio" ? null : current.reps ? fitReps(current.reps, best) : null,
      swapped_from: exerciseId,
    };
  }
  return null;
}

/** Rough length of a day in minutes, including warm-up. */
export function estimateMinutes(day: PlanDay): number {
  return Math.round((WARMUP_SECONDS + day.exercises.reduce((sum, it) => sum + itemSeconds(it), 0)) / 60);
}
