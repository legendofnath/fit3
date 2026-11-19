"use client";

import { useEffect, useRef } from "react";
import { EQUIPMENT_BY_ID } from "@/lib/catalog";
import { EXERCISES_BY_ID, PATTERN_INFO } from "@/lib/exercises";
import { ROLE_INFO } from "@/lib/learn";
import type { LastResult, Muscle, PlanExercise, Units } from "@/lib/types";
import { EquipmentArt } from "./EquipmentArt";

export const MUSCLE_NAME: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  core: "Core",
  cardio: "Cardio",
};

/** Full explanation of one exercise: what it trains, how to do it, and why it is in the plan. */
export function ExerciseSheet({
  exerciseId,
  item,
  last,
  units,
  onClose,
}: {
  exerciseId: string;
  item?: PlanExercise;
  last?: LastResult;
  units: Units;
  onClose: () => void;
}) {
  const ex = EXERCISES_BY_ID[exerciseId];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!ex) return null;
  const pattern = PATTERN_INFO[ex.pattern];
  const role = item?.role ? ROLE_INFO[item.role] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="sheet panel flex max-h-[90vh] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-b-none sm:rounded-b-[20px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="sheet-title" className="display">
              {ex.name}
            </h2>
            <p className="muted small mt-1">
              {pattern.name} · {["", "Beginner", "Intermediate", "Advanced"][ex.difficulty]}
            </p>
          </div>
          <button ref={closeRef} className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {ex.requires.length > 0 && (
          <div className="well flex gap-3 overflow-x-auto p-2">
            {ex.requires.map((id) => (
              <figure key={id} className="flex w-28 shrink-0 flex-col items-center gap-1">
                <EquipmentArt id={id} className="w-full" />
                <figcaption className="small text-center leading-tight">{EQUIPMENT_BY_ID[id]?.name ?? id}</figcaption>
              </figure>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-2">
          <h3>Muscles</h3>
          <ul className="flex flex-wrap gap-2">
            <li className="tag" style={{ background: "var(--chalk)", color: "var(--iron)" }}>
              {MUSCLE_NAME[ex.muscle]}
            </li>
            {ex.secondary.map((m) => (
              <li key={m} className="tag">
                {MUSCLE_NAME[m]}
              </li>
            ))}
          </ul>
          <p className="muted small">{pattern.about}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3>How to do it</h3>
          <p>{ex.cues}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h3>Common mistake</h3>
          <p>{ex.mistake}</p>
        </section>

        {item && role && (
          <section className="well flex flex-col gap-2">
            <h3>Why it&apos;s in today&apos;s plan</h3>
            <p className="small">
              <strong>{role.name}.</strong> {role.about}
            </p>
            {item.reps && (
              <p className="small">
                {item.sets} sets of {item.reps[0] === item.reps[1] ? item.reps[0] : `${item.reps[0]} to ${item.reps[1]}`} reps,
                resting {Math.round(item.rest_seconds / 60 * 10) / 10} minutes between sets.
                {last
                  ? last.hit_top
                    ? ` Last time you hit the top of the range at ${last.weight} ${units}, so the target goes up.`
                    : ` Last time you used ${last.weight} ${units}. Stay there until every set reaches ${item.reps[1]} reps.`
                  : " First time: pick a weight you could lift for two more reps than the top of the range."}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
