export type Goal = "power" | "strength" | "weight_loss" | "bodybuilding";
export type Units = "lb" | "kg";
export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "cardio";
export type Movement = "push" | "pull" | "squat" | "hinge" | "core" | "cardio";
export type Kind = "compound" | "isolation" | "cardio";
export type AvoidTag = "overhead" | "spinal_load" | "jumping" | "deep_knee";
export type GymType = "commercial" | "strength" | "functional" | "small" | "home";
export type EquipmentCategory =
  | "Free weights"
  | "Benches and racks"
  | "Cables and machines"
  | "Cardio"
  | "Functional"
  | "Other";

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  aliases: string[];
}

/** Movement pattern, used to fill split slots and to explain technique. */
export type Pattern =
  | "h_push"
  | "v_push"
  | "h_pull"
  | "v_pull"
  | "squat"
  | "hinge"
  | "lunge"
  | "isolation"
  | "core"
  | "carry"
  | "cardio";

/** How heavy a role an exercise can play in a session. */
export type Tier = "main" | "secondary" | "accessory";

export interface Exercise {
  id: string;
  name: string;
  /** Every item is required. Empty means bodyweight only. */
  requires: string[];
  muscle: Muscle;
  /** Muscles that also work hard. */
  secondary: Muscle[];
  movement: Movement;
  pattern: Pattern;
  kind: Kind;
  tier: Tier;
  /** 3 is the standard gym choice, 1 is a niche alternative. */
  staple: 1 | 2 | 3;
  /** How draining it is: 3 means heavy, whole-body fatigue. */
  fatigue: 1 | 2 | 3;
  /** 1 beginner, 2 intermediate, 3 advanced */
  difficulty: 1 | 2 | 3;
  /** Rep range this exercise is suited to. */
  repRange: [number, number];
  avoid: AvoidTag[];
  cues: string;
  /** The most common mistake. */
  mistake: string;
}

export interface Profile {
  id: string;
  goal: Goal;
  experience: 1 | 2 | 3;
  days_per_week: number;
  session_minutes: number;
  avoid: AvoidTag[];
  units: Units;
  gym_id: string | null;
}

export interface Gym {
  id: string;
  name: string;
  address: string | null;
  gym_type: GymType;
  is_private: boolean;
  created_by: string | null;
}

export interface GymEquipmentRow {
  gym_id: string;
  equipment_id: string;
  custom_name: string | null;
  present: boolean;
  source: "baseline" | "member";
}

export interface EquipmentChange {
  id: number;
  gym_id: string;
  equipment_id: string;
  custom_name: string | null;
  action: "add" | "remove" | "restore";
  user_id: string | null;
  created_at: string;
}

export type Role = "main" | "secondary" | "accessory" | "finisher";

export interface PlanExercise {
  exercise_id: string;
  /** Why it is in the session; sets the sets, reps and rest. */
  role?: Role;
  sets: number;
  /** [low, high]; null for timed cardio */
  reps: [number, number] | null;
  /** minutes, for cardio only */
  minutes: number | null;
  rest_seconds: number;
  target_weight: number | null;
  /** set when this exercise replaced another one */
  swapped_from?: string;
}

export interface PlanDay {
  focus: string;
  /** Split id and day index when generated from a split. */
  split?: string;
  day_index?: number;
  /** One or two sentences on why this session was chosen. */
  reason?: string;
  exercises: PlanExercise[];
}

export interface WeekPlan {
  goal: Goal;
  units: Units;
  days: PlanDay[];
}

/** Most recent logged result for one exercise. */
export interface LastResult {
  weight: number;
  /** true when every logged set reached the top of the rep range */
  hit_top: boolean;
}

export interface JournalSet {
  id: number;
  exercise_id: string;
  gym_id: string | null;
  performed_on: string;
  set_number: number;
  reps: number;
  weight: number | null;
  unit: Units;
  target_reps_high: number | null;
}
