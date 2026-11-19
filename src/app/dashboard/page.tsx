"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EquipmentArt } from "@/components/EquipmentArt";
import { EQUIPMENT_BY_ID } from "@/lib/catalog";
import { EXERCISES_BY_ID } from "@/lib/exercises";
import {
  FOCUSES,
  estimateMinutes,
  findSubstitute,
  generateSession,
  type Focus,
  type GeneratorProfile,
} from "@/lib/generator";
import { currentGym, gymEquipment, kgToLb, update, useStore } from "@/lib/store";
import type { Goal, PlanExercise } from "@/lib/types";

const GOAL_NAME: Record<Goal, string> = {
  strength: "Strength",
  bodybuilding: "Build muscle",
  power: "Power",
  weight_loss: "Lose weight",
};

/** Rough metabolic equivalents for a resistance session by goal. */
const MET: Record<Goal, number> = { strength: 5, bodybuilding: 5, power: 4.5, weight_loss: 6 };

const clock = () => Date.now();
const nowHHMM = () => {
  const d = new Date();
  // Round up to the next quarter hour.
  const minutes = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 15) * 15;
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

function addMinutes(hhmm: string, add: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + Math.round(add)) % (24 * 60);
  const d = new Date(2000, 0, 1, Math.floor(total / 60), total % 60);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function itemMinutes(item: PlanExercise): number {
  return item.minutes ?? (item.sets * (45 + item.rest_seconds) + 60) / 60;
}

export default function DashboardPage() {
  const state = useStore();
  const router = useRouter();
  const gym = state.hydrated ? currentGym(state) : null;
  const missingSetup = state.hydrated && (!state.body || !state.prefs || !gym);

  useEffect(() => {
    if (!missingSetup) return;
    router.replace(!state.body || !state.prefs ? "/setup" : "/gym");
  }, [missingSetup, state.body, state.prefs, router]);

  if (!state.hydrated || missingSetup || !gym || !state.prefs) return null;
  return <Dashboard key={gym.id} />;
}

function Dashboard() {
  const state = useStore();
  const gym = currentGym(state)!;
  const prefs = state.prefs!;
  const saved = state.session && state.session.gymId === gym.id ? state.session : null;

  const [focus, setFocus] = useState<Focus>((saved?.day.focus as Focus) ?? "Full body");
  const [minutes, setMinutes] = useState(saved?.minutes ?? prefs.session_minutes);
  const [goal, setGoal] = useState<Goal>(saved?.goal ?? prefs.goal);
  const [start, setStart] = useState(saved?.start ?? nowHHMM);
  const [notice, setNotice] = useState<string | null>(null);
  const [openCue, setOpenCue] = useState<string | null>(null);

  const equipment = gymEquipment(state, gym);
  const available = new Set(equipment.map((item) => item.id));
  const profile: GeneratorProfile = { ...prefs, goal, session_minutes: minutes };

  function generate() {
    const day = generateSession(profile, available, focus, {}, String(clock()));
    setNotice(null);
    update(() => ({ session: { day, gymId: gym.id, goal, minutes, start } }));
  }

  function swap(exerciseId: string) {
    if (!saved) return;
    const without = new Set(available);
    for (const r of EXERCISES_BY_ID[exerciseId].requires) without.delete(r);
    const sub = findSubstitute(saved.day, exerciseId, without, profile, {}, String(clock()));
    if (!sub) {
      setNotice(`Nothing else here works the same muscle without that equipment. Skip ${EXERCISES_BY_ID[exerciseId].name} today.`);
      return;
    }
    setNotice(`Swapped ${EXERCISES_BY_ID[exerciseId].name} for ${EXERCISES_BY_ID[sub.exercise_id].name}.`);
    update(() => ({
      session: {
        ...saved,
        day: {
          ...saved.day,
          exercises: saved.day.exercises.map((it) => (it.exercise_id === exerciseId ? sub : it)),
        },
      },
    }));
  }

  const total = saved ? estimateMinutes(saved.day) : 0;
  const kcal =
    saved && state.body?.weight_kg
      ? Math.round(MET[saved.goal] * state.body.weight_kg * (total / 60))
      : null;

  // Clock time each exercise starts, after a 5 minute warm-up.
  let elapsed = 5;
  const timeline = saved?.day.exercises.map((item) => {
    const at = elapsed;
    elapsed += itemMinutes(item);
    return at;
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="muted">{gym.name}</p>
        <h1 className="display">Build a workout</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Controls */}
        <section className="panel flex flex-col gap-6 lg:sticky lg:top-4 lg:self-start" aria-label="Workout settings">
          <fieldset>
            <legend className="field-label">Focus</legend>
            <div className="choices">
              {FOCUSES.map((f) => (
                <label key={f} className="choice">
                  <input type="radio" name="focus" checked={focus === f} onChange={() => setFocus(f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="duration">
              Duration: <span className="num text-2xl">{minutes}</span> min
            </label>
            <input
              id="duration"
              type="range"
              min={20}
              max={120}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label" htmlFor="start">
                Start at
              </label>
              <input id="start" type="time" className="input" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="goal">
                Goal
              </label>
              <select id="goal" className="input" value={goal} onChange={(e) => setGoal(e.target.value as Goal)}>
                {(Object.keys(GOAL_NAME) as Goal[]).map((g) => (
                  <option key={g} value={g}>
                    {GOAL_NAME[g]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button className="btn btn-go w-full" onClick={generate}>
            {saved ? "Generate a new workout" : "Generate workout"}
          </button>

          <p className="muted small">
            Using {available.size} pieces of equipment at {gym.name}.{" "}
            <Link href="/equipment" className="underline underline-offset-4">
              Check the list
            </Link>
          </p>
        </section>

        {/* Workout */}
        <section className="flex flex-col gap-4" aria-live="polite">
          {!saved ? (
            <div className="panel flex min-h-64 flex-col items-start justify-center gap-3">
              <h2 className="display">Ready when you are</h2>
              <p className="lede">
                Pick a focus and how long you have, then generate. Every exercise will use equipment
                {" "}{gym.name} has.
              </p>
            </div>
          ) : (
            <>
              <header className="panel flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="display">{saved.day.focus}</h2>
                  <p className="muted">
                    {GOAL_NAME[saved.goal]} · {addMinutes(saved.start, 0)} to {addMinutes(saved.start, total)}
                  </p>
                </div>
                <dl className="flex gap-6">
                  <div>
                    <dt className="small muted">Minutes</dt>
                    <dd className="num text-3xl">{total}</dd>
                  </div>
                  <div>
                    <dt className="small muted">Exercises</dt>
                    <dd className="num text-3xl">{saved.day.exercises.length}</dd>
                  </div>
                  {kcal !== null && (
                    <div>
                      <dt className="small muted">About kcal</dt>
                      <dd className="num text-3xl">{kcal}</dd>
                    </div>
                  )}
                </dl>
              </header>

              {notice && <p className="well small">{notice}</p>}

              <ol className="flex flex-col gap-2">
                <li className="well flex items-center gap-4">
                  <span className="num w-14 shrink-0 text-lg">{addMinutes(saved.start, 0)}</span>
                  <span>
                    <span className="block font-semibold">Warm-up, 5 minutes</span>
                    <span className="muted small">Easy cardio, then two light sets of your first exercise.</span>
                  </span>
                </li>
                {saved.day.exercises.map((item, i) => {
                  const ex = EXERCISES_BY_ID[item.exercise_id];
                  // Show the most distinctive piece: the bench or rack rather than the bar.
                  const main = ex.requires.at(-1);
                  const cue = openCue === item.exercise_id;
                  const target =
                    item.target_weight !== null
                      ? ` · ${prefs.units === "lb" ? item.target_weight : item.target_weight} ${prefs.units}`
                      : "";
                  return (
                    <li key={item.exercise_id} className="panel flex flex-col gap-3 p-4">
                      <div className="flex items-center gap-4">
                        <span className="num w-14 shrink-0 text-lg">{addMinutes(saved.start, timeline![i])}</span>
                        <div className="well hidden h-16 w-20 shrink-0 p-1 sm:block">
                          {main ? (
                            <EquipmentArt id={main} className="h-full w-full" />
                          ) : (
                            <span className="muted small flex h-full items-center justify-center text-center">Body weight</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3>{ex.name}</h3>
                          <p className="muted small">
                            {item.minutes
                              ? `${item.minutes} minutes`
                              : `${item.sets} sets × ${item.reps![0]}–${item.reps![1]} reps · rest ${item.rest_seconds}s`}
                            {target}
                          </p>
                          <p className="muted small">
                            {ex.requires.length
                              ? ex.requires.map((r) => EQUIPMENT_BY_ID[r]?.name ?? r).join(" + ")
                              : "No equipment"}
                            {item.swapped_from && " · swapped in"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:pl-[10.5rem]">
                        <button
                          className="btn btn-sm"
                          aria-expanded={cue}
                          onClick={() => setOpenCue(cue ? null : item.exercise_id)}
                        >
                          {cue ? "Hide how-to" : "How to"}
                        </button>
                        <button className="btn btn-sm" onClick={() => swap(item.exercise_id)}>
                          {ex.requires.length ? "Equipment taken, swap" : "Swap"}
                        </button>
                      </div>
                      {cue && <p className="well small sm:ml-[10.5rem]">{ex.cues}</p>}
                    </li>
                  );
                })}
              </ol>

              {state.body?.weight_kg && (
                <p className="muted small">
                  Calories are a rough estimate from your weight ({prefs.units === "lb" ? `${kgToLb(state.body.weight_kg)} lb` : `${Math.round(state.body.weight_kg)} kg`}) and the session length.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
