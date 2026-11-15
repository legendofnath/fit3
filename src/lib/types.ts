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

export interface Exercise {
  id: string;
  name: string;
  /** Every item is required. Empty means bodyweight only. */
  requires: string[];
  muscle: Muscle;
  movement: Movement;
  kind: Kind;
  /** 1 beginner, 2 intermediate, 3 advanced */
  difficulty: 1 | 2 | 3;
  avoid: AvoidTag[];
  cues: string;
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

export interface PlanExercise {
  exercise_id: string;
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
