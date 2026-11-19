import assert from "node:assert/strict";
import { test } from "node:test";
import { BASELINES, EQUIPMENT_BY_ID } from "../src/lib/catalog";
import { EXERCISES, EXERCISES_BY_ID } from "../src/lib/exercises";
import {
  estimateMinutes,
  findSubstitute,
  generateSplitDay,
  generateWeek,
  nextTarget,
  validatePlan,
  type GeneratorProfile,
} from "../src/lib/generator";
import { SPLITS } from "../src/lib/splits";
import {
  computeStats,
  lastResults,
  recommendDay,
  weeklySets,
  type WorkoutLog,
} from "../src/lib/history";
import type { Goal, GymType } from "../src/lib/types";

const base: GeneratorProfile = {
  goal: "strength",
  experience: 2,
  days_per_week: 4,
  session_minutes: 60,
  avoid: [],
  units: "lb",
};

const GOALS: Goal[] = ["power", "strength", "weight_loss", "bodybuilding"];
const TYPES = Object.keys(BASELINES) as GymType[];
const commercial = new Set(BASELINES.commercial);
const ex = (id: string) => EXERCISES_BY_ID[id];

test("library and baselines only reference catalog equipment, with valid fields", () => {
  const ids = new Set<string>();
  for (const e of EXERCISES) {
    assert.ok(!ids.has(e.id), `duplicate ${e.id}`);
    ids.add(e.id);
    for (const item of e.requires) assert.ok(EQUIPMENT_BY_ID[item], `${e.id} needs unknown ${item}`);
    assert.ok(e.repRange[0] <= e.repRange[1], `${e.id} rep range`);
    assert.ok(e.cues.length > 10 && e.mistake.length > 5, `${e.id} needs a cue and a mistake`);
  }
  for (const type of TYPES) {
    for (const item of BASELINES[type]) assert.ok(EQUIPMENT_BY_ID[item], `${type} lists unknown ${item}`);
  }
  for (const split of SPLITS) {
    for (const day of split.days) {
      for (const slot of day.slots) for (const id of slot.prefer ?? []) assert.ok(EXERCISES_BY_ID[id], `${split.id} prefers unknown ${id}`);
    }
  }
  assert.ok(EXERCISES.length >= 150, `only ${EXERCISES.length} exercises`);
});

test("every split day, at every gym type and goal, uses only the gym's equipment", () => {
  for (const type of TYPES) {
    const available = new Set(BASELINES[type]);
    for (const goal of GOALS) {
      for (const split of SPLITS) {
        for (let i = 0; i < split.days.length; i++) {
          for (const experience of [1, 2, 3] as const) {
            const day = generateSplitDay({ ...base, goal, experience }, available, split.id, i, { seed: "t" });
            const label = `${type}/${goal}/${split.id}/${day.focus}/${experience}`;
            assert.deepEqual(validatePlan({ goal, units: "lb", days: [day] }, available), [], label);
            assert.ok(day.exercises.filter((e) => e.role !== "finisher").length >= 3, `${label} too short`);
            const ids = day.exercises.map((e) => e.exercise_id);
            assert.equal(new Set(ids).size, ids.length, `${label} repeats an exercise`);
          }
        }
      }
    }
  }
});

test("at a well-equipped gym, staples are chosen over niche alternatives", () => {
  const push = generateSplitDay({ ...base, goal: "bodybuilding" }, commercial, "ppl", 0, { seed: "a" });
  const legs = generateSplitDay({ ...base, goal: "bodybuilding" }, commercial, "ppl", 2, { seed: "a" });
  const all = [...push.exercises, ...legs.exercises].map((e) => ex(e.exercise_id));
  assert.ok(all.every((e) => e.staple >= 2), all.filter((e) => e.staple < 2).map((e) => e.name).join(", "));
  assert.equal(ex(push.exercises[0].exercise_id).muscle, "chest");
  assert.equal(ex(legs.exercises[0].exercise_id).pattern, "squat");
});

test("main lifts come first and get the heaviest prescription", () => {
  const day = generateSplitDay({ ...base, goal: "strength" }, commercial, "upper_lower", 0, { seed: "x" });
  assert.equal(day.exercises[0].role, "main");
  const order = day.exercises.map((e) => ["main", "secondary", "accessory", "finisher"].indexOf(e.role!));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  const main = day.exercises.find((e) => e.role === "main")!;
  const accessory = day.exercises.find((e) => e.role === "accessory")!;
  assert.ok(main.reps![1] <= accessory.reps![0], "accessories use higher reps than main lifts");
});

test("rep ranges respect what each exercise suits", () => {
  for (const goal of GOALS) {
    for (const split of SPLITS) {
      for (let i = 0; i < split.days.length; i++) {
        const day = generateSplitDay({ ...base, goal }, commercial, split.id, i, { seed: "r" });
        for (const item of day.exercises) {
          if (!item.reps) continue;
          const e = ex(item.exercise_id);
          assert.ok(item.reps[0] >= e.repRange[0] && item.reps[1] <= e.repRange[1], `${e.name} ${item.reps} vs ${e.repRange}`);
        }
      }
    }
  }
});

test("no session stacks two very draining lifts unless the program calls for it", () => {
  for (const goal of GOALS) {
    for (const split of SPLITS.filter((s) => s.id !== "five_by_five")) {
      for (let i = 0; i < split.days.length; i++) {
        const day = generateSplitDay({ ...base, goal }, commercial, split.id, i, { seed: "f" });
        const heavy = day.exercises.filter((e) => ex(e.exercise_id).fatigue === 3);
        assert.ok(heavy.length <= 1, `${split.id} ${day.focus}: ${heavy.map((h) => h.exercise_id)}`);
      }
    }
  }
});

test("5x5 uses the prescribed lifts and five sets of five", () => {
  const a = generateSplitDay({ ...base, experience: 2, session_minutes: 75 }, commercial, "five_by_five", 0, {});
  assert.deepEqual(a.exercises.slice(0, 3).map((e) => e.exercise_id), ["back_squat", "barbell_bench_press", "barbell_row"]);
  assert.deepEqual(a.exercises[0].reps, [5, 5]);
  assert.equal(a.exercises[0].sets, 5);
});

test("sessions fit inside the requested time", () => {
  for (const goal of GOALS) {
    for (const minutes of [30, 45, 60, 90]) {
      for (const split of SPLITS) {
        for (let i = 0; i < split.days.length; i++) {
          const day = generateSplitDay({ ...base, goal, session_minutes: minutes }, commercial, split.id, i, { seed: "m" });
          assert.ok(estimateMinutes(day) <= minutes + 3, `${goal} ${split.id} ${day.focus} ${minutes}: ${estimateMinutes(day)}`);
        }
      }
    }
  }
});

test("recently used exercises are rotated out when good alternatives exist", () => {
  const first = generateSplitDay({ ...base, goal: "bodybuilding" }, commercial, "ppl", 0, { seed: "v" });
  const recent = first.exercises.map((e) => e.exercise_id);
  const second = generateSplitDay({ ...base, goal: "bodybuilding" }, commercial, "ppl", 0, { seed: "v", recent: [...recent, ...recent] });
  const repeated = second.exercises.filter((e) => recent.includes(e.exercise_id)).length;
  assert.ok(repeated < recent.length, "some exercises change");
});

test("weight loss ends with a cardio finisher", () => {
  for (const split of ["full_body", "upper_lower", "ppl"]) {
    const day = generateSplitDay({ ...base, goal: "weight_loss" }, commercial, split, 0, {});
    assert.equal(ex(day.exercises.at(-1)!.exercise_id).kind, "cardio");
  }
});

test("a gym with no equipment still gets a bodyweight session", () => {
  for (const split of SPLITS) {
    const day = generateSplitDay({ ...base, experience: 1 }, new Set(), split.id, 0, {});
    assert.ok(day.exercises.filter((e) => e.role !== "finisher").length >= 3, split.id);
    for (const item of day.exercises) assert.deepEqual(ex(item.exercise_id).requires, []);
  }
});

test("difficulty and avoid tags are respected", () => {
  const plan = generateWeek(
    { ...base, experience: 1, avoid: ["overhead", "spinal_load", "deep_knee", "jumping"], days_per_week: 6 },
    commercial,
    "ppl",
  );
  for (const day of plan.days) {
    for (const item of day.exercises) {
      assert.equal(ex(item.exercise_id).difficulty, 1);
      assert.deepEqual(ex(item.exercise_id).avoid, []);
    }
  }
});

test("a swap keeps the muscle and role and avoids the taken equipment", () => {
  const day = generateSplitDay(base, commercial, "upper_lower", 1, { seed: "s" });
  for (const item of day.exercises) {
    const original = ex(item.exercise_id);
    const without = new Set(commercial);
    for (const r of original.requires) without.delete(r);
    const sub = findSubstitute(day, item.exercise_id, without, base);
    if (!sub) continue;
    const replacement = ex(sub.exercise_id);
    assert.equal(replacement.muscle, original.muscle);
    assert.equal(sub.role, item.role);
    assert.ok(replacement.requires.every((r) => without.has(r)));
  }
});

// ---------- history ----------

function log(partial: Partial<WorkoutLog> & { exercises: WorkoutLog["exercises"]; finished_at: number }): WorkoutLog {
  return {
    id: String(partial.finished_at),
    date: "2026-11-01",
    started_at: partial.finished_at - 3600000,
    gym_id: "g",
    gym_name: "Gym",
    focus: "Push",
    goal: "strength",
    unit: "lb",
    kcal: 300,
    ...partial,
  };
}

const NOW = new Date(2026, 10, 18, 18).getTime();
const H = 3600000;
const set = (weight: number, reps: number) => ({ weight, reps });

test("progression adds weight only when every set reached the top of the range", () => {
  assert.equal(nextTarget(undefined, "lb"), null);
  assert.equal(nextTarget({ weight: 100, hit_top: true }, "lb"), 105);
  assert.equal(nextTarget({ weight: 40, hit_top: true }, "kg"), 42.5);
  const results = lastResults([
    log({ finished_at: NOW - 48 * H, exercises: [{ exercise_id: "barbell_bench_press", reps: [4, 6], minutes: null, sets: [set(185, 6), set(185, 6)] }] }),
    log({ finished_at: NOW - 24 * H, exercises: [{ exercise_id: "barbell_row", reps: [6, 8], minutes: null, sets: [set(135, 8), set(135, 6)] }] }),
  ]);
  assert.deepEqual(results.barbell_bench_press, { weight: 185, hit_top: true });
  assert.deepEqual(results.barbell_row, { weight: 135, hit_top: false });
  const day = generateSplitDay(base, commercial, "five_by_five", 0, { history: { barbell_bench_press: { weight: 185, hit_top: true } } });
  assert.equal(day.exercises.find((e) => e.exercise_id === "barbell_bench_press")!.target_weight, 190);
});

test("the next day follows the rotation and skips muscles that are not recovered", () => {
  assert.equal(recommendDay("ppl", [], NOW).dayIndex, 0);
  const pushYesterday = log({ finished_at: NOW - 30 * H, split: "ppl", day_index: 0, exercises: [{ exercise_id: "barbell_bench_press", reps: [4, 6], minutes: null, sets: [set(135, 5)] }] });
  assert.equal(recommendDay("ppl", [pushYesterday], NOW).dayIndex, 1, "pull follows push");

  // Legs were trained 10 hours ago outside the program: the legs day is skipped for now.
  const legsToday = log({
    finished_at: NOW - 10 * H,
    exercises: [
      { exercise_id: "back_squat", reps: [4, 6], minutes: null, sets: [set(225, 5)] },
      { exercise_id: "leg_curl", reps: [8, 12], minutes: null, sets: [set(90, 10)] },
      { exercise_id: "machine_calf_raise", reps: [8, 12], minutes: null, sets: [set(90, 10)] },
    ],
  });
  const pull = log({ finished_at: NOW - 60 * H, split: "ppl", day_index: 1, exercises: [{ exercise_id: "barbell_row", reps: [4, 6], minutes: null, sets: [set(135, 5)] }] });
  const rec = recommendDay("ppl", [pull, legsToday], NOW);
  assert.equal(rec.dayIndex, 0, rec.reason);
});

test("stats count days, volume, sets per muscle and the weekly streak", () => {
  const logs = [
    log({ finished_at: NOW - 2 * H, date: "2026-11-18", exercises: [{ exercise_id: "barbell_bench_press", reps: [4, 6], minutes: null, sets: [set(100, 5), set(100, 5)] }] }),
    log({ finished_at: NOW - 8 * 24 * H, date: "2026-11-10", exercises: [{ exercise_id: "back_squat", reps: [4, 6], minutes: null, sets: [set(200, 5)] }] }),
    log({ finished_at: NOW - 40 * 24 * H, date: "2026-10-09", exercises: [{ exercise_id: "back_squat", reps: [4, 6], minutes: null, sets: [set(200, 5)] }] }),
  ];
  const stats = computeStats(logs, "lb", NOW);
  assert.equal(stats.daysLast30, 2);
  assert.equal(stats.volumeLast30, 100 * 5 * 2 + 200 * 5);
  assert.equal(stats.workoutsThisWeek, 1);
  assert.equal(stats.streakWeeks, 2);
  const sets = weeklySets(logs, NOW);
  assert.equal(sets.chest, 2);
  assert.equal(sets.triceps, 1);
  assert.equal(sets.quads, 0);
});
