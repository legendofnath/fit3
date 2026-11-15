"use client";

import { useState } from "react";
import { EQUIPMENT_BY_ID } from "@/lib/catalog";
import type { Exercise, JournalSet, PlanExercise, Units } from "@/lib/types";

interface Props {
  item: PlanExercise;
  exercise: Exercise;
  logged: JournalSet[];
  units: Units;
  busy: boolean;
  onLog: (weight: number | null, reps: number) => void;
  onTaken: () => void;
  onMissing: (equipmentId: string) => void;
}

export function ExerciseCard({ item, exercise, logged, units, busy, onLog, onTaken, onMissing }: Props) {
  const lastWeight = logged.at(-1)?.weight ?? item.target_weight;
  const [weight, setWeight] = useState(lastWeight === null ? "" : String(lastWeight));
  const [reps, setReps] = useState(item.reps ? String(item.reps[1]) : "");
  const [swapping, setSwapping] = useState(false);
  const cardio = exercise.kind === "cardio";
  const done = logged.length >= item.sets;
  const needs = exercise.requires.map((id) => EQUIPMENT_BY_ID[id]?.name ?? id);

  function log() {
    if (cardio) {
      onLog(null, item.minutes ?? 10);
      return;
    }
    const r = Number(reps);
    if (!Number.isFinite(r) || r < 0) return;
    const w = weight.trim() === "" ? null : Number(weight);
    if (w !== null && (!Number.isFinite(w) || w < 0)) return;
    onLog(w, Math.round(r));
  }

  return (
    <article className="card flex flex-col gap-3" style={done ? { borderColor: "var(--good)" } : undefined}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2>{exercise.name}</h2>
          <p className="muted text-sm">
            {cardio
              ? `${item.minutes} minutes`
              : `${item.sets} sets of ${item.reps?.[0]} to ${item.reps?.[1]} reps, rest ${item.rest_seconds}s`}
          </p>
        </div>
        {done && (
          <span className="text-sm font-semibold" style={{ color: "var(--good)" }}>
            Done
          </span>
        )}
      </header>

      <p className="text-sm">{exercise.cues}</p>
      <p className="muted text-sm">
        {needs.length ? `Uses: ${needs.join(", ")}` : "Bodyweight"}
        {item.target_weight !== null && ` · Target ${item.target_weight} ${units}`}
        {item.target_weight === null && !cardio && needs.length > 0 &&
          " · First time: pick a weight you could lift for 2 more reps than the top of the range"}
      </p>

      {logged.length > 0 && (
        <ol className="flex flex-wrap gap-2 text-sm">
          {logged.map((set) => (
            <li key={set.id} className="notice font-mono">
              {cardio ? `${set.reps} min` : `${set.weight ?? "BW"} × ${set.reps}`}
            </li>
          ))}
        </ol>
      )}

      <div className="flex items-end gap-2">
        {!cardio && (
          <>
            <div className="flex-1">
              <label className="label" htmlFor={`w-${exercise.id}`}>
                Weight ({units})
              </label>
              <input
                id={`w-${exercise.id}`}
                className="input"
                inputMode="decimal"
                placeholder={needs.length ? "" : "optional"}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label" htmlFor={`r-${exercise.id}`}>
                Reps
              </label>
              <input
                id={`r-${exercise.id}`}
                className="input"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
              />
            </div>
          </>
        )}
        <button className="btn btn-primary" disabled={busy} onClick={log}>
          {cardio ? "Mark done" : `Log set ${logged.length + 1}`}
        </button>
      </div>

      {!swapping ? (
        <button className="btn btn-small btn-quiet self-start" onClick={() => setSwapping(true)}>
          Can&apos;t do this one?
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <button className="btn btn-small" disabled={busy} onClick={onTaken}>
            {needs.length ? "Equipment is taken — swap for today" : "Swap for another exercise"}
          </button>
          {exercise.requires.map((id) => (
            <button key={id} className="btn btn-small" disabled={busy} onClick={() => onMissing(id)}>
              This gym has no {(EQUIPMENT_BY_ID[id]?.name ?? id).toLowerCase()}
            </button>
          ))}
          <button className="btn btn-small btn-quiet" onClick={() => setSwapping(false)}>
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}
