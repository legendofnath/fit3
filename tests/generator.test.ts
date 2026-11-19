import assert from "node:assert/strict";
import { test } from "node:test";
import { BASELINES, EQUIPMENT_BY_ID } from "../src/lib/catalog";
import { EXERCISES, EXERCISES_BY_ID } from "../src/lib/exercises";
import {
  estimateMinutes,
  findSubstitute,
  generateWeek,
  nextTarget,
  repairPlan,
  validatePlan,
  type GeneratorProfile,
} from "../src/lib/generator";
import type { Goal, GymType } from "../src/lib/types";

const base: GeneratorProfile = {
  goal: "strength",
  experience: 2,
  days_per_week: 3,
  session_minutes: 60,
  avoid: [],
  units: "lb",
};

const GOALS: Goal[] = ["power", "strength", "weight_loss", "bodybuilding"];
const TYPES = Object.keys(BASELINES) as GymType[];

test("library and baselines only reference catalog equipment", () => {
  for (const ex of EXERCISES) {
    for (const item of ex.requires) assert.ok(EQUIPMENT_BY_ID[item], `${ex.id} needs unknown ${item}`);
  }
  for (const type of TYPES) {
    for (const item of BASELINES[type]) assert.ok(EQUIPMENT_BY_ID[item], `${type} lists unknown ${item}`);
  }
  assert.equal(new Set(EXERCISES.map((ex) => ex.id)).size, EXERCISES.length, "duplicate exercise id");
});

test("every plan uses only equipment the gym has", () => {
  for (const type of TYPES) {
    const available = new Set(BASELINES[type]);
    for (const goal of GOALS) {
      for (let days = 1; days <= 6; days++) {
        for (const experience of [1, 2, 3] as const) {
          const plan = generateWeek({ ...base, goal, days_per_week: days, experience }, available, {}, "seed");
          assert.equal(plan.days.length, days);
          assert.deepEqual(validatePlan(plan, available), [], `${type}/${goal}/${days}`);
          for (const day of plan.days) {
            assert.ok(day.exercises.length >= 3, `${type}/${goal}/${days} ${day.focus} is too short`);
            const ids = day.exercises.map((item) => item.exercise_id);
            assert.equal(new Set(ids).size, ids.length, "exercise repeated within a day");
          }
        }
      }
    }
  }
});

test("difficulty and avoid tags are respected", () => {
  const available = new Set(BASELINES.commercial);
  const plan = generateWeek(
    { ...base, experience: 1, avoid: ["overhead", "spinal_load", "deep_knee", "jumping"], days_per_week: 6 },
    available,
  );
  for (const day of plan.days) {
    for (const item of day.exercises) {
      const ex = EXERCISES_BY_ID[item.exercise_id];
      assert.equal(ex.difficulty, 1);
      assert.deepEqual(ex.avoid, []);
    }
  }
});

test("sessions fit roughly inside the requested time", () => {
  const available = new Set(BASELINES.commercial);
  for (const goal of GOALS) {
    for (const minutes of [45, 60, 90]) {
      const plan = generateWeek({ ...base, goal, session_minutes: minutes, days_per_week: 4 }, available);
      for (const day of plan.days) {
        assert.ok(estimateMinutes(day) <= minutes + 2, `${goal} ${minutes} gave ${estimateMinutes(day)}`);
      }
    }
  }
});

test("weight loss adds a cardio finisher, other goals do not", () => {
  const available = new Set(BASELINES.commercial);
  const loss = generateWeek({ ...base, goal: "weight_loss" }, available);
  for (const day of loss.days) {
    assert.equal(EXERCISES_BY_ID[day.exercises.at(-1)!.exercise_id].kind, "cardio");
  }
  const strength = generateWeek(base, available);
  for (const day of strength.days) {
    assert.ok(day.exercises.every((item) => EXERCISES_BY_ID[item.exercise_id].kind !== "cardio"));
  }
});

test("generation is stable for a seed and varies across seeds", () => {
  const available = new Set(BASELINES.commercial);
  assert.deepEqual(generateWeek(base, available, {}, "a"), generateWeek(base, available, {}, "a"));
  const seeds = ["a", "b", "c", "d", "e"].map((seed) => JSON.stringify(generateWeek(base, available, {}, seed)));
  assert.ok(new Set(seeds).size > 1);
});

test("next target goes up only when the top of the range was reached", () => {
  assert.equal(nextTarget(undefined, "lb"), null);
  assert.equal(nextTarget({ weight: 100, hit_top: true }, "lb"), 105);
  assert.equal(nextTarget({ weight: 100, hit_top: false }, "lb"), 100);
  assert.equal(nextTarget({ weight: 40, hit_top: true }, "kg"), 42.5);
  const plan = generateWeek(base, new Set(BASELINES.commercial), {
    barbell_bench_press: { weight: 135, hit_top: true },
    dumbbell_bench_press: { weight: 50, hit_top: true },
    machine_chest_press: { weight: 90, hit_top: true },
    smith_bench_press: { weight: 95, hit_top: true },
    incline_barbell_press: { weight: 95, hit_top: true },
    incline_dumbbell_press: { weight: 40, hit_top: true },
    dip: { weight: 10, hit_top: true },
  });
  const chest = plan.days[0].exercises.find((item) => EXERCISES_BY_ID[item.exercise_id].muscle === "chest")!;
  assert.ok(chest.target_weight !== null && chest.target_weight > 0);
});

test("a swap trains the same muscle and avoids the taken equipment", () => {
  const available = new Set(BASELINES.commercial);
  const plan = generateWeek(base, available, {}, "swap");
  for (const day of plan.days) {
    for (const item of day.exercises) {
      const original = EXERCISES_BY_ID[item.exercise_id];
      const without = new Set(available);
      for (const r of original.requires) without.delete(r);
      const sub = findSubstitute(day, item.exercise_id, without, base);
      if (!sub) continue;
      const replacement = EXERCISES_BY_ID[sub.exercise_id];
      assert.equal(replacement.muscle, original.muscle);
      assert.equal(sub.swapped_from, original.id);
      assert.ok(replacement.requires.every((r) => without.has(r)));
      assert.ok(!day.exercises.some((other) => other.exercise_id === sub.exercise_id));
    }
  }
});

test("repairing a plan after equipment is removed leaves it valid", () => {
  const available = new Set(BASELINES.commercial);
  const plan = generateWeek({ ...base, days_per_week: 5 }, available, {}, "repair");
  const reduced = new Set(available);
  for (const item of ["barbell", "cable_station", "leg_press", "lat_pulldown"]) reduced.delete(item);
  const repaired = repairPlan(plan, reduced, base);
  assert.deepEqual(validatePlan(repaired, reduced), []);
  assert.equal(repaired.days.length, plan.days.length);
});

test("a gym with no equipment still gets a bodyweight plan", () => {
  const plan = generateWeek({ ...base, experience: 1 }, new Set());
  for (const day of plan.days) {
    assert.ok(day.exercises.length >= 3);
    for (const item of day.exercises) assert.deepEqual(EXERCISES_BY_ID[item.exercise_id].requires, []);
  }
});

test("a single session respects focus, length and equipment", async () => {
  const { generateSession, FOCUSES } = await import("../src/lib/generator");
  const available = new Set(BASELINES.commercial);
  for (const focus of FOCUSES) {
    for (const minutes of [30, 45, 60, 90]) {
      const day = generateSession({ ...base, session_minutes: minutes }, available, focus, {}, "s");
      assert.equal(day.focus, focus);
      assert.ok(day.exercises.length >= 3);
      assert.ok(estimateMinutes(day) <= minutes + 2, `${focus} ${minutes} gave ${estimateMinutes(day)}`);
      assert.deepEqual(validatePlan({ goal: "strength", units: "lb", days: [day] }, available), []);
    }
  }
  const legs = generateSession(base, available, "Legs", {}, "s");
  assert.ok(legs.exercises.every((it) => ["quads", "hamstrings", "glutes", "calves", "core"].includes(EXERCISES_BY_ID[it.exercise_id].muscle)));
});
