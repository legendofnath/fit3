"use client";

import { useState } from "react";
import { useApp } from "@/lib/app";
import { db } from "@/lib/supabase";
import type { AvoidTag, Goal, Units } from "@/lib/types";

const GOALS: { id: Goal; name: string; detail: string }[] = [
  { id: "strength", name: "Strength", detail: "Heavier weights, 4 to 6 reps" },
  { id: "power", name: "Power", detail: "Heaviest lifts, 2 to 5 reps, long rest" },
  { id: "bodybuilding", name: "Bodybuilding", detail: "Muscle size, 8 to 15 reps" },
  { id: "weight_loss", name: "Weight loss", detail: "Higher reps, short rest, cardio finisher" },
];

const AVOID: { id: AvoidTag; name: string }[] = [
  { id: "overhead", name: "Pressing overhead" },
  { id: "spinal_load", name: "Heavy load on the back" },
  { id: "deep_knee", name: "Deep knee bends" },
  { id: "jumping", name: "Jumping" },
];

/** Used for first-time setup and for editing the profile later. */
export function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const { userId, profile, refresh } = useApp();
  const first = !profile;
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? "strength");
  const [experience, setExperience] = useState<number>(profile?.experience ?? 1);
  const [days, setDays] = useState<number>(profile?.days_per_week ?? 3);
  const [minutes, setMinutes] = useState<number>(profile?.session_minutes ?? 60);
  const [avoid, setAvoid] = useState<AvoidTag[]>(profile?.avoid ?? []);
  const [units, setUnits] = useState<Units>(profile?.units ?? "lb");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!userId) return;
    setBusy(true);
    setError(null);
    const fields = {
      goal,
      experience,
      days_per_week: days,
      session_minutes: minutes,
      avoid,
      units,
    };
    const { error: err } = first
      ? await db()
          .from("profiles")
          .insert({ id: userId, ...fields, adult_confirmed_at: new Date().toISOString() })
      : await db().from("profiles").update(fields).eq("id", userId);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await refresh();
    onSaved?.();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <fieldset>
        <legend className="label">Goal</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label
              key={g.id}
              className="card flex cursor-pointer items-start gap-3"
              style={goal === g.id ? { borderColor: "var(--accent)" } : undefined}
            >
              <input
                type="radio"
                name="goal"
                className="mt-1"
                checked={goal === g.id}
                onChange={() => setGoal(g.id)}
              />
              <span>
                <span className="block font-semibold">{g.name}</span>
                <span className="muted block text-sm">{g.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="experience">
            Experience
          </label>
          <select
            id="experience"
            className="input"
            value={experience}
            onChange={(e) => setExperience(Number(e.target.value))}
          >
            <option value={1}>Beginner</option>
            <option value={2}>Intermediate</option>
            <option value={3}>Advanced</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="units">
            Units
          </label>
          <select
            id="units"
            className="input"
            value={units}
            onChange={(e) => setUnits(e.target.value as Units)}
          >
            <option value="lb">Pounds</option>
            <option value="kg">Kilograms</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="days">
            Days per week
          </label>
          <select id="days" className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="minutes">
            Session length
          </label>
          <select
            id="minutes"
            className="input"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          >
            {[30, 45, 60, 75, 90].map((n) => (
              <option key={n} value={n}>
                {n} minutes
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="label">Movements to leave out</legend>
        <div className="flex flex-col gap-2">
          {AVOID.map((a) => (
            <label key={a.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={avoid.includes(a.id)}
                onChange={(e) =>
                  setAvoid(e.target.checked ? [...avoid, a.id] : avoid.filter((t) => t !== a.id))
                }
              />
              {a.name}
            </label>
          ))}
        </div>
      </fieldset>

      {first && (
        <label className="notice flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1"
            required
            checked={adult}
            onChange={(e) => setAdult(e.target.checked)}
          />
          <span>
            I am 18 or older. I understand these workouts are general suggestions, not medical
            advice, and that I train at my own risk. I will stop and get help if something hurts.
          </span>
        </label>
      )}

      {error && <p className="notice notice-error">{error}</p>}
      <button className="btn btn-primary" disabled={busy}>
        {first ? "Continue" : "Save"}
      </button>
    </form>
  );
}
