import type { Muscle, Pattern, Role } from "./types";

/** How a day is trained. Normally set by the member's goal; some splits fix it per day. */
export type Style = "power" | "strength" | "hypertrophy" | "conditioning";

export interface Slot {
  role: Role;
  /** Exercise must use one of these patterns. */
  patterns?: Pattern[];
  /** Exercise's main muscle must be one of these. */
  muscles?: Muscle[];
  /** Exercise ids strongly preferred for this slot, in order. */
  prefer?: string[];
  /** Fixed sets and reps, for programs like 5x5. */
  scheme?: { sets: number; reps: [number, number] };
}

export interface SplitDay {
  name: string;
  /** Main muscles trained; used for recovery and for the weekly picture. */
  muscles: Muscle[];
  slots: Slot[];
  /** Overrides the goal's style for this day only. */
  style?: Style;
}

export interface Split {
  id: string;
  name: string;
  /** Days per week this split is designed for. */
  daysPerWeek: number[];
  level: "Beginner" | "Intermediate" | "Advanced" | "Any";
  bestFor: string;
  about: string;
  days: SplitDay[];
}

const main = (patterns: Pattern[], extra: Partial<Slot> = {}): Slot => ({ role: "main", patterns, ...extra });
const second = (patterns: Pattern[], extra: Partial<Slot> = {}): Slot => ({ role: "secondary", patterns, ...extra });
const acc = (...muscles: Muscle[]): Slot => ({ role: "accessory", muscles });
const core: Slot = { role: "accessory", patterns: ["core", "carry"] };
const SIDE_DELTS = ["cable_lateral_raise", "lateral_raise", "machine_lateral_raise"];
const REAR_DELTS = ["face_pull", "reverse_pec_deck", "rear_delt_fly", "band_pull_apart"];

const PUSH: SplitDay = {
  name: "Push",
  muscles: ["chest", "shoulders", "triceps"],
  slots: [
    main(["h_push"], { muscles: ["chest"] }),
    second(["v_push"]),
    second(["h_push"], { muscles: ["chest"] }),
    { role: "accessory", muscles: ["shoulders"], prefer: SIDE_DELTS },
    acc("chest"),
    acc("triceps"),
    acc("triceps"),
  ],
};

const PULL: SplitDay = {
  name: "Pull",
  muscles: ["back", "biceps"],
  slots: [
    main(["v_pull", "h_pull"]),
    second(["h_pull"]),
    second(["v_pull"]),
    { role: "accessory", muscles: ["shoulders"], patterns: ["isolation"], prefer: REAR_DELTS },
    acc("biceps"),
    acc("biceps"),
    core,
  ],
};

const LEGS: SplitDay = {
  name: "Legs",
  muscles: ["quads", "hamstrings", "glutes", "calves"],
  slots: [
    main(["squat"]),
    second(["hinge"]),
    second(["lunge", "squat"]),
    acc("hamstrings"),
    acc("quads"),
    acc("calves"),
    core,
  ],
};

const UPPER_A: SplitDay = {
  name: "Upper",
  muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
  slots: [
    main(["h_push"], { muscles: ["chest"] }),
    main(["h_pull"]),
    second(["v_push"]),
    second(["v_pull"]),
    acc("shoulders"),
    acc("biceps"),
    acc("triceps"),
  ],
};

const UPPER_B: SplitDay = {
  name: "Upper",
  muscles: ["chest", "back", "shoulders", "biceps", "triceps"],
  slots: [
    main(["v_pull"]),
    main(["v_push", "h_push"]),
    second(["h_pull"]),
    second(["h_push"], { muscles: ["chest"] }),
    acc("shoulders"),
    acc("triceps"),
    acc("biceps"),
  ],
};

const LOWER_A: SplitDay = {
  name: "Lower",
  muscles: ["quads", "hamstrings", "glutes", "calves"],
  slots: [main(["squat"]), second(["hinge"]), second(["lunge"]), acc("hamstrings"), acc("calves"), core],
};

const LOWER_B: SplitDay = {
  name: "Lower",
  muscles: ["hamstrings", "glutes", "quads", "calves"],
  slots: [main(["hinge"]), second(["squat"]), acc("quads"), acc("glutes"), acc("calves"), core],
};

const FULL_A: SplitDay = {
  name: "Full body A",
  muscles: ["quads", "chest", "back", "hamstrings"],
  slots: [
    main(["squat"]),
    main(["h_push"], { muscles: ["chest"] }),
    second(["h_pull"]),
    second(["hinge"]),
    acc("shoulders"),
    acc("biceps"),
    acc("triceps"),
    core,
  ],
};

const FULL_B: SplitDay = {
  name: "Full body B",
  muscles: ["hamstrings", "glutes", "shoulders", "back", "quads"],
  slots: [
    main(["hinge"]),
    main(["v_push", "h_push"]),
    second(["v_pull"]),
    second(["lunge"]),
    acc("chest"),
    acc("triceps"),
    acc("calves"),
    core,
  ],
};

const FULL_C: SplitDay = {
  name: "Full body C",
  muscles: ["quads", "chest", "back", "glutes"],
  slots: [
    main(["lunge", "squat"]),
    main(["h_pull", "v_pull"]),
    second(["h_push"]),
    second(["hinge"]),
    acc("shoulders"),
    acc("biceps"),
    acc("hamstrings"),
    core,
  ],
};

export const SPLITS: Split[] = [
  {
    id: "full_body",
    name: "Full body",
    daysPerWeek: [2, 3],
    level: "Beginner",
    bestFor: "New lifters and busy weeks",
    about: "Every session trains the whole body, so each muscle gets work two or three times a week even on a tight schedule. Rotates through three versions so the exercises change.",
    days: [FULL_A, FULL_B, FULL_C],
  },
  {
    id: "five_by_five",
    name: "5×5 A/B",
    daysPerWeek: [3],
    level: "Beginner",
    bestFor: "Getting strong on the barbell lifts",
    about: "Two short workouts alternated three times a week. Five sets of five on the big barbell lifts, adding weight every session while you can.",
    days: [
      {
        name: "Workout A",
        muscles: ["quads", "chest", "back"],
        style: "strength",
        slots: [
          main(["squat"], { prefer: ["back_squat", "safety_bar_squat", "goblet_squat"], scheme: { sets: 5, reps: [5, 5] } }),
          main(["h_push"], { prefer: ["barbell_bench_press", "dumbbell_bench_press"], scheme: { sets: 5, reps: [5, 5] } }),
          main(["h_pull"], { prefer: ["barbell_row", "pendlay_row", "dumbbell_row"], scheme: { sets: 5, reps: [5, 5] } }),
          core,
        ],
      },
      {
        name: "Workout B",
        muscles: ["quads", "shoulders", "hamstrings"],
        style: "strength",
        slots: [
          main(["squat"], { prefer: ["back_squat", "safety_bar_squat", "goblet_squat"], scheme: { sets: 5, reps: [5, 5] } }),
          main(["v_push"], { prefer: ["overhead_press", "dumbbell_shoulder_press"], scheme: { sets: 5, reps: [5, 5] } }),
          main(["hinge"], { prefer: ["deadlift", "trap_bar_deadlift"], scheme: { sets: 1, reps: [5, 5] } }),
          { role: "accessory", patterns: ["v_pull"] },
          core,
        ],
      },
    ],
  },
  {
    id: "upper_lower",
    name: "Upper / lower",
    daysPerWeek: [4],
    level: "Intermediate",
    bestFor: "Steady progress on four days",
    about: "Alternates upper-body and lower-body days, so each muscle is trained twice a week with a rest day between.",
    days: [UPPER_A, LOWER_A, UPPER_B, LOWER_B],
  },
  {
    id: "ppl",
    name: "Push / pull / legs",
    daysPerWeek: [3, 6],
    level: "Intermediate",
    bestFor: "Building muscle",
    about: "Pressing muscles one day, pulling muscles the next, legs on the third. Run it once a week for three days or twice for six.",
    days: [PUSH, PULL, LEGS],
  },
  {
    id: "ulppl",
    name: "Upper / lower + push / pull / legs",
    daysPerWeek: [5],
    level: "Intermediate",
    bestFor: "Five days, size and strength",
    about: "An upper and a lower day early in the week, then push, pull and legs. Every muscle gets two sessions in five days.",
    days: [UPPER_A, LOWER_A, PUSH, PULL, LEGS],
  },
  {
    id: "phul",
    name: "Power and size upper / lower",
    daysPerWeek: [4],
    level: "Intermediate",
    bestFor: "Strength and muscle together",
    about: "Two heavy days with low reps on the big lifts, then two higher-rep days for muscle size.",
    days: [
      { ...UPPER_A, name: "Upper power", style: "power" },
      { ...LOWER_A, name: "Lower power", style: "power" },
      { ...UPPER_B, name: "Upper size", style: "hypertrophy" },
      { ...LOWER_B, name: "Lower size", style: "hypertrophy" },
    ],
  },
  {
    id: "arnold",
    name: "Arnold split",
    daysPerWeek: [3, 6],
    level: "Advanced",
    bestFor: "High-volume muscle building",
    about: "Chest and back together, shoulders and arms together, then legs. Pairs opposing muscles so one rests while the other works.",
    days: [
      {
        name: "Chest and back",
        muscles: ["chest", "back"],
        slots: [
          main(["h_push"], { muscles: ["chest"] }),
          main(["v_pull", "h_pull"]),
          second(["h_push"], { muscles: ["chest"] }),
          second(["h_pull"]),
          acc("chest"),
          acc("back"),
          core,
        ],
      },
      {
        name: "Shoulders and arms",
        muscles: ["shoulders", "biceps", "triceps"],
        slots: [
          main(["v_push"]),
          acc("shoulders"),
          { role: "accessory", muscles: ["shoulders"], patterns: ["isolation"] },
          acc("biceps"),
          acc("triceps"),
          acc("biceps"),
          acc("triceps"),
        ],
      },
      LEGS,
    ],
  },
  {
    id: "body_part",
    name: "Body-part split",
    daysPerWeek: [5],
    level: "Advanced",
    bestFor: "Bodybuilding-style focus",
    about: "One or two muscle groups a day with lots of sets for each. Each muscle is trained once a week, so every session has to count.",
    days: [
      {
        name: "Chest",
        muscles: ["chest"],
        slots: [main(["h_push"], { muscles: ["chest"] }), second(["h_push"], { muscles: ["chest"] }), second(["h_push"], { muscles: ["chest"] }), acc("chest"), acc("chest"), core],
      },
      {
        name: "Back",
        muscles: ["back"],
        slots: [main(["v_pull"]), main(["h_pull"]), second(["h_pull"]), second(["v_pull"]), acc("back"), core],
      },
      {
        name: "Shoulders",
        muscles: ["shoulders"],
        slots: [main(["v_push"]), second(["v_push"]), acc("shoulders"), acc("shoulders"), acc("shoulders"), acc("back")],
      },
      {
        name: "Arms",
        muscles: ["biceps", "triceps"],
        slots: [second(["h_push"], { muscles: ["triceps"] }), acc("biceps"), acc("triceps"), acc("biceps"), acc("triceps"), acc("biceps"), acc("triceps")],
      },
      LEGS,
    ],
  },
  {
    id: "strength_four",
    name: "Four main lifts",
    daysPerWeek: [4],
    level: "Intermediate",
    bestFor: "Raising your squat, bench, deadlift and press",
    about: "Each day is built around one heavy barbell lift, followed by assistance work for the muscles that lift needs.",
    days: [
      { name: "Squat day", muscles: ["quads", "glutes"], style: "strength", slots: [main(["squat"], { prefer: ["back_squat", "safety_bar_squat", "front_squat"] }), second(["squat", "lunge"]), acc("hamstrings"), acc("quads"), core] },
      { name: "Bench day", muscles: ["chest", "triceps"], style: "strength", slots: [main(["h_push"], { prefer: ["barbell_bench_press", "dumbbell_bench_press"] }), second(["h_push"]), second(["h_pull"]), acc("triceps"), acc("shoulders")] },
      { name: "Deadlift day", muscles: ["hamstrings", "back", "glutes"], style: "strength", slots: [main(["hinge"], { prefer: ["deadlift", "trap_bar_deadlift", "sumo_deadlift"] }), second(["hinge"]), second(["v_pull"]), acc("back"), core] },
      { name: "Press day", muscles: ["shoulders", "triceps", "back"], style: "strength", slots: [main(["v_push"], { prefer: ["overhead_press", "push_press", "dumbbell_shoulder_press"] }), second(["v_pull"]), second(["h_push"]), acc("shoulders"), acc("biceps")] },
    ],
  },
  {
    id: "lower_focus",
    name: "Lower-body focus",
    daysPerWeek: [3, 4],
    level: "Any",
    bestFor: "Glutes and legs",
    about: "Two leg days, one glute-led and one quad-led, with lighter upper-body days between.",
    days: [
      { name: "Glutes and hamstrings", muscles: ["glutes", "hamstrings"], slots: [main(["hinge"], { prefer: ["hip_thrust", "machine_hip_thrust"] }), second(["hinge"]), second(["lunge"]), acc("glutes"), acc("hamstrings"), acc("glutes")] },
      UPPER_A,
      { name: "Quads and glutes", muscles: ["quads", "glutes"], slots: [main(["squat"]), second(["lunge"]), second(["hinge"], { muscles: ["glutes"] }), acc("quads"), acc("glutes"), acc("calves")] },
      UPPER_B,
    ],
  },
  {
    id: "conditioning",
    name: "Circuit conditioning",
    daysPerWeek: [2, 3, 4],
    level: "Any",
    bestFor: "Weight loss and fitness in short sessions",
    about: "Lighter full-body work with short rests and a cardio finisher. Keeps the heart rate up while still building muscle.",
    days: [
      { name: "Circuit A", muscles: ["quads", "chest", "back"], style: "conditioning", slots: [second(["squat"]), second(["h_push"]), second(["h_pull"]), acc("glutes"), core, { role: "finisher" }] },
      { name: "Circuit B", muscles: ["hamstrings", "shoulders", "back"], style: "conditioning", slots: [second(["hinge"]), second(["v_push", "h_push"]), second(["v_pull"]), second(["lunge"]), core, { role: "finisher" }] },
    ],
  },
];

export const SPLITS_BY_ID: Record<string, Split> = Object.fromEntries(SPLITS.map((s) => [s.id, s]));

/** A sensible default split for a member's days per week and goal. */
export function defaultSplit(daysPerWeek: number, goal: string, experience: number): string {
  if (goal === "weight_loss" && daysPerWeek <= 3) return "conditioning";
  if (daysPerWeek <= 2) return "full_body";
  if (daysPerWeek === 3) return experience === 1 ? "full_body" : "ppl";
  if (daysPerWeek === 4) return goal === "strength" || goal === "power" ? "phul" : "upper_lower";
  if (daysPerWeek === 5) return "ulppl";
  return "ppl";
}
