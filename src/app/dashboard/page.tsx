"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MuscleSetsChart } from "@/components/Charts";
import { EquipmentArt } from "@/components/EquipmentArt";
import { ExerciseSheet } from "@/components/ExerciseSheet";
import { EXERCISES_BY_ID } from "@/lib/exercises";
import {
  STYLE_FOR_GOAL,
  estimateMinutes,
  findSubstitute,
  generateSplitDay,
  type GeneratorProfile,
} from "@/lib/generator";
import {
  WEEKLY_TARGET,
  computeStats,
  estimateKcal,
  lastResults,
  localDate,
  recentExercises,
  recommendDay,
  weeklySets,
  workoutVolume,
  type WorkoutLog,
} from "@/lib/history";
import { ROLE_INFO, STYLE_INFO } from "@/lib/learn";
import { SPLITS, SPLITS_BY_ID, defaultSplit } from "@/lib/splits";
import { currentGym, gymEquipment, update, useStore, type SetEntry, type Session } from "@/lib/store";
import type { Goal, PlanExercise, Role } from "@/lib/types";

const GOAL_NAME: Record<Goal, string> = {
  strength: "Strength",
  bodybuilding: "Build muscle",
  power: "Power",
  weight_loss: "Lose weight",
};

const ROLE_COLOR: Record<Role, string> = {
  main: "var(--plate-red)",
  secondary: "var(--plate-blue)",
  accessory: "var(--plate-green)",
  finisher: "var(--slate)",
};

const clock = () => Date.now();
const nowHHMM = () => {
  const d = new Date();
  const minutes = Math.ceil((d.getHours() * 60 + d.getMinutes()) / 15) * 15;
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

function clockTime(hhmm: string, add: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + Math.round(add)) % (24 * 60);
  return new Date(2000, 0, 1, Math.floor(total / 60), total % 60).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function itemMinutes(item: PlanExercise): number {
  return item.minutes ?? (item.sets * (45 + item.rest_seconds) + 60) / 60;
}

function blankEntries(item: PlanExercise, units: string): SetEntry[] {
  void units;
  const weight = item.target_weight === null ? "" : String(item.target_weight);
  return Array.from({ length: item.minutes ? 1 : item.sets }, () => ({
    weight,
    reps: item.minutes ? String(item.minutes) : item.reps ? String(item.reps[1]) : "",
    done: false,
  }));
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
  const units = prefs.units;
  const saved = state.session && state.session.gymId === gym.id ? state.session : null;
  const splitId = prefs.split ?? defaultSplit(prefs.days_per_week, prefs.goal, prefs.experience);
  const split = SPLITS_BY_ID[splitId] ?? SPLITS[0];

  const [now] = useState(clock);
  const recommendation = recommendDay(split.id, state.log, now);
  const [dayIndex, setDayIndex] = useState(saved?.day.day_index ?? recommendation.dayIndex);
  const [minutes, setMinutes] = useState(saved?.minutes ?? prefs.session_minutes);
  const [goal, setGoal] = useState<Goal>(saved?.goal ?? prefs.goal);
  const [start, setStart] = useState(saved?.start ?? nowHHMM);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [finished, setFinished] = useState<WorkoutLog | null>(null);

  const equipment = gymEquipment(state, gym);
  const available = new Set(equipment.map((item) => item.id));
  const history = lastResults(state.log);
  const profile: GeneratorProfile = { ...prefs, goal, session_minutes: minutes };
  const stats = computeStats(state.log, units, now);
  const sets = weeklySets(state.log, now);

  function chooseSplit(id: string) {
    update((s) => ({ prefs: s.prefs ? { ...s.prefs, split: id } : s.prefs }));
    setDayIndex(recommendDay(id, state.log, now).dayIndex);
  }

  function generate() {
    const day = generateSplitDay(profile, available, split.id, dayIndex, {
      history,
      recent: recentExercises(state.log),
      seed: String(clock()),
    });
    const entries = Object.fromEntries(day.exercises.map((item) => [item.exercise_id, blankEntries(item, units)]));
    setNotice(null);
    setFinished(null);
    update(() => ({
      session: { day, gymId: gym.id, goal, minutes, start, entries, started_at: null },
    }));
  }

  function patchSession(change: (s: Session) => Partial<Session>) {
    update((s) => (s.session ? { session: { ...s.session, ...change(s.session) } } : {}));
  }

  function setEntry(exerciseId: string, index: number, patch: Partial<SetEntry>) {
    patchSession((s) => {
      const list = [...(s.entries?.[exerciseId] ?? [])];
      list[index] = { ...list[index], ...patch };
      // Carry a changed weight down to the sets that are not done yet.
      if (patch.weight !== undefined) {
        for (let i = index + 1; i < list.length; i++) if (!list[i].done) list[i] = { ...list[i], weight: patch.weight };
      }
      return {
        entries: { ...s.entries, [exerciseId]: list },
        started_at: s.started_at ?? (patch.done ? clock() : null),
      };
    });
  }

  function addSet(exerciseId: string) {
    patchSession((s) => {
      const list = s.entries?.[exerciseId] ?? [];
      const last = list.at(-1) ?? { weight: "", reps: "", done: false };
      return { entries: { ...s.entries, [exerciseId]: [...list, { ...last, done: false }] } };
    });
  }

  function swap(exerciseId: string) {
    if (!saved) return;
    const without = new Set(available);
    for (const r of EXERCISES_BY_ID[exerciseId].requires) without.delete(r);
    const sub = findSubstitute(saved.day, exerciseId, without, profile, history, String(clock()));
    if (!sub) {
      setNotice(`Nothing else here works the same muscle without that equipment. Skip ${EXERCISES_BY_ID[exerciseId].name} today.`);
      return;
    }
    setNotice(`Swapped ${EXERCISES_BY_ID[exerciseId].name} for ${EXERCISES_BY_ID[sub.exercise_id].name}.`);
    patchSession((s) => {
      const entries = { ...s.entries };
      delete entries[exerciseId];
      entries[sub.exercise_id] = blankEntries(sub, units);
      return {
        day: { ...s.day, exercises: s.day.exercises.map((it) => (it.exercise_id === exerciseId ? sub : it)) },
        entries,
      };
    });
  }

  function finish() {
    if (!saved) return;
    const end = clock();
    const exercises = saved.day.exercises
      .map((item) => ({
        exercise_id: item.exercise_id,
        role: item.role,
        reps: item.reps,
        minutes: item.minutes,
        sets: (saved.entries?.[item.exercise_id] ?? [])
          .filter((e) => e.done)
          .map((e) => ({ weight: e.weight.trim() === "" ? null : Number(e.weight) || null, reps: Number(e.reps) || 0 })),
      }))
      .filter((ex) => ex.sets.length > 0);
    const actual = saved.started_at ? Math.round((end - saved.started_at) / 60000) : 0;
    const duration = actual >= 10 ? actual : estimateMinutes(saved.day);
    const entry: WorkoutLog = {
      id: `w${end.toString(36)}`,
      date: localDate(end),
      started_at: end - duration * 60000,
      finished_at: end,
      gym_id: gym.id,
      gym_name: gym.name,
      split: saved.day.split,
      day_index: saved.day.day_index,
      focus: saved.day.focus,
      goal: saved.goal,
      unit: units,
      exercises,
      kcal: estimateKcal(saved.goal, state.body?.weight_kg, duration),
    };
    update((s) => ({ log: [entry, ...s.log], session: null }));
    setFinished(entry);
    setDayIndex(recommendDay(split.id, [entry, ...state.log], end).dayIndex);
  }

  const doneSets = saved
    ? Object.values(saved.entries ?? {}).reduce((n, list) => n + list.filter((e) => e.done).length, 0)
    : 0;
  const total = saved ? estimateMinutes(saved.day) : 0;
  let elapsed = 5;
  const timeline = saved?.day.exercises.map((item) => {
    const at = elapsed;
    elapsed += itemMinutes(item);
    return at;
  });
  const style = saved ? (SPLITS_BY_ID[saved.day.split ?? ""]?.days[saved.day.day_index ?? 0]?.style ?? STYLE_FOR_GOAL[saved.goal]) : null;
  const sheetItem = saved?.day.exercises.find((e) => e.exercise_id === sheet);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="muted">{gym.name}</p>
        <h1 className="display">{saved ? saved.day.focus : "Today's workout"}</h1>
      </div>

      {/* Statistics */}
      <section aria-label="Your training" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: "Workouts this week", value: stats.workoutsThisWeek },
          { label: "Gym days, 30 days", value: stats.daysLast30 },
          { label: `Weight moved, 30 days (${units})`, value: stats.volumeLast30.toLocaleString() },
          { label: "Calories, 30 days", value: stats.kcalLast30 ? stats.kcalLast30.toLocaleString() : "–" },
          { label: "Week streak", value: stats.streakWeeks },
        ].map((s) => (
          <div key={s.label} className="panel p-4 last:col-span-2 sm:last:col-span-1">
            <p className="num text-3xl">{s.value}</p>
            <p className="muted small leading-tight">{s.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Controls */}
        <section
          className={`panel flex flex-col gap-6 lg:sticky lg:top-4 lg:order-1 lg:self-start ${saved ? "order-2" : "order-1"}`}
          aria-label="Workout settings"
        >
          <div className="well flex flex-col gap-1">
            <p className="small font-semibold">Next up: {split.days[recommendation.dayIndex].name}</p>
            <p className="muted small">{recommendation.reason}</p>
          </div>

          <div>
            <label className="field-label" htmlFor="split">
              Training split
            </label>
            <select id="split" className="input" value={split.id} onChange={(e) => chooseSplit(e.target.value)}>
              {SPLITS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.daysPerWeek.join(" or ")} days)
                </option>
              ))}
            </select>
            <p className="muted small mt-2">
              {split.bestFor}.{" "}
              <Link href="/learn#splits" className="underline underline-offset-4">
                About splits
              </Link>
            </p>
          </div>

          <fieldset>
            <legend className="field-label">Day</legend>
            <div className="choices">
              {split.days.map((d, i) => (
                <label key={`${d.name}${i}`} className="choice">
                  <input type="radio" name="day" checked={dayIndex % split.days.length === i} onChange={() => setDayIndex(i)} />
                  <span>
                    {d.name}
                    {i === recommendation.dayIndex && <span className="sr-only"> (recommended)</span>}
                    {i === recommendation.dayIndex && <span aria-hidden className="ml-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "var(--plate-yellow)" }} />}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="field-label" htmlFor="duration">
              Duration: <span className="num text-2xl">{minutes}</span> min
            </label>
            <input id="duration" type="range" min={20} max={120} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
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
            {saved ? "Build a new workout" : "Build workout"}
          </button>
          {saved && doneSets > 0 && <p className="muted small -mt-3">Building a new one discards the sets you have ticked.</p>}

          <p className="muted small">
            Using {available.size} pieces of equipment at {gym.name}.{" "}
            <Link href="/equipment" className="underline underline-offset-4">
              Check the list
            </Link>
          </p>
        </section>

        {/* Workout */}
        <section className={`flex min-w-0 flex-col gap-4 lg:order-2 ${saved ? "order-1" : "order-2"}`} aria-live="polite">
          {finished && (
            <div className="panel flex flex-col gap-3" style={{ outline: "1.5px solid var(--plate-green)" }}>
              <h2 className="display">Workout logged</h2>
              <dl className="flex flex-wrap gap-6">
                <div>
                  <dt className="muted small">Sets</dt>
                  <dd className="num text-3xl">{finished.exercises.reduce((n, e) => n + (e.minutes ? 0 : e.sets.length), 0)}</dd>
                </div>
                <div>
                  <dt className="muted small">Weight moved ({units})</dt>
                  <dd className="num text-3xl">{workoutVolume(finished, units).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="muted small">Minutes</dt>
                  <dd className="num text-3xl">{Math.round((finished.finished_at - finished.started_at) / 60000)}</dd>
                </div>
                {finished.kcal !== null && (
                  <div>
                    <dt className="muted small">About kcal</dt>
                    <dd className="num text-3xl">{finished.kcal}</dd>
                  </div>
                )}
              </dl>
              <p className="muted small">
                Saved to your history. Next up is {split.days[recommendDay(split.id, state.log, finished.finished_at).dayIndex].name}.{" "}
                <Link href="/history" className="underline underline-offset-4">
                  View history
                </Link>
              </p>
            </div>
          )}

          {!saved && !finished && (
            <div className="panel flex min-h-64 flex-col items-start justify-center gap-3">
              <h2 className="display">Ready when you are</h2>
              <p className="lede">
                Your next day is {split.days[recommendation.dayIndex].name}. Pick how long you have, then build the
                workout. Every exercise will use equipment {gym.name} has.
              </p>
            </div>
          )}

          {saved && (
            <>
              <header className="panel flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="display">{saved.day.focus}</h2>
                    <p className="muted">
                      {SPLITS_BY_ID[saved.day.split ?? ""]?.name ?? "Workout"} · {GOAL_NAME[saved.goal]} ·{" "}
                      {clockTime(saved.start, 0)} to {clockTime(saved.start, total)}
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
                    <div>
                      <dt className="small muted">Sets done</dt>
                      <dd className="num text-3xl">{doneSets}</dd>
                    </div>
                  </dl>
                </div>
                {style && (
                  <p className="small muted">
                    <strong className="text-[var(--chalk)]">{STYLE_INFO[style].name}:</strong> {STYLE_INFO[style].about}
                  </p>
                )}
              </header>

              {notice && <p className="well small">{notice}</p>}

              <ol className="flex flex-col gap-2">
                <li className="well flex items-center gap-4">
                  <span className="num w-16 shrink-0 text-lg">{clockTime(saved.start, 0)}</span>
                  <span>
                    <span className="block font-semibold">Warm-up, 5 minutes</span>
                    <span className="muted small">Easy cardio, then two light sets of your first exercise.</span>
                  </span>
                </li>
                {saved.day.exercises.map((item, i) => {
                  const ex = EXERCISES_BY_ID[item.exercise_id];
                  const kit = ex.requires.at(-1);
                  const entries = saved.entries?.[item.exercise_id] ?? [];
                  const role = item.role ?? "accessory";
                  const done = entries.length > 0 && entries.every((e) => e.done);
                  return (
                    <li key={item.exercise_id} className="panel flex flex-col gap-3 p-4" style={done ? { outline: "1.5px solid var(--plate-green)" } : undefined}>
                      <div className="flex items-start gap-3 sm:gap-4">
                        <span className="num w-16 shrink-0 pt-0.5 text-lg">{clockTime(saved.start, timeline![i])}</span>
                        <button
                          className="well hidden h-16 w-20 shrink-0 p-1 sm:block"
                          onClick={() => setSheet(item.exercise_id)}
                          aria-label={`About ${ex.name}`}
                        >
                          {kit ? <EquipmentArt id={kit} className="h-full w-full" /> : <span className="muted small">Body weight</span>}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="small mb-0.5 flex items-center gap-1.5 font-medium">
                            <span className="tag-dot" style={{ color: ROLE_COLOR[role] }} />
                            {ROLE_INFO[role].name}
                            {item.swapped_from && <span className="muted"> · swapped in</span>}
                          </p>
                          <h3>
                            <button className="text-left underline decoration-[var(--edge)] underline-offset-4" onClick={() => setSheet(item.exercise_id)}>
                              {ex.name}
                            </button>
                          </h3>
                          <p className="muted small">
                            {item.minutes
                              ? `${item.minutes} minutes`
                              : `${item.sets} × ${item.reps![0] === item.reps![1] ? item.reps![0] : `${item.reps![0]}–${item.reps![1]}`} reps · rest ${item.rest_seconds >= 120 ? `${item.rest_seconds / 60} min` : `${item.rest_seconds}s`}`}
                            {item.target_weight !== null && ` · target ${item.target_weight} ${units}`}
                          </p>
                        </div>
                      </div>

                      {/* Set logging */}
                      <div className="flex flex-col gap-1.5 sm:pl-[10.5rem]">
                        {entries.map((entry, n) => (
                          <div key={n} className="flex items-center gap-2">
                            <span className="muted small w-12 shrink-0">{item.minutes ? "Time" : `Set ${n + 1}`}</span>
                            {!item.minutes && (
                              <input
                                className="input w-24 min-h-10"
                                inputMode="decimal"
                                aria-label={`Set ${n + 1} weight in ${units}`}
                                placeholder={ex.requires.length ? units : "BW"}
                                value={entry.weight}
                                onChange={(e) => setEntry(item.exercise_id, n, { weight: e.target.value })}
                              />
                            )}
                            <input
                              className="input w-20 min-h-10"
                              inputMode="numeric"
                              aria-label={item.minutes ? "Minutes" : `Set ${n + 1} reps`}
                              value={entry.reps}
                              onChange={(e) => setEntry(item.exercise_id, n, { reps: e.target.value })}
                            />
                            <span className="muted small">{item.minutes ? "min" : "reps"}</span>
                            <button
                              className="btn btn-sm ml-auto"
                              aria-pressed={entry.done}
                              style={entry.done ? { background: "var(--plate-green)", borderColor: "var(--plate-green)", color: "var(--iron)" } : undefined}
                              onClick={() => setEntry(item.exercise_id, n, { done: !entry.done })}
                            >
                              {entry.done ? "Done" : "Log"}
                            </button>
                          </div>
                        ))}
                        <div className="mt-1 flex flex-wrap gap-2">
                          {!item.minutes && (
                            <button className="btn btn-sm" onClick={() => addSet(item.exercise_id)}>
                              Add set
                            </button>
                          )}
                          <button className="btn btn-sm" onClick={() => setSheet(item.exercise_id)}>
                            How to
                          </button>
                          {/* Once a set is logged the exercise is done here; swapping would lose it. */}
                          {!entries.some((e) => e.done) && (
                            <button className="btn btn-sm" onClick={() => swap(item.exercise_id)}>
                              {ex.requires.length ? "Equipment taken, swap" : "Swap"}
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="panel flex flex-wrap items-center justify-between gap-3">
                <p className="muted small">
                  {doneSets ? `${doneSets} sets logged.` : "Tick Log after each set."} Finishing saves the workout to your history.
                </p>
                <button className="btn btn-go" disabled={doneSets === 0} onClick={finish}>
                  Finish and log workout
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="panel flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display">This week by muscle</h2>
          <Link href="/learn#weekly-sets" className="small underline underline-offset-4">
            Why weekly sets matter
          </Link>
        </div>
        {state.log.length ? (
          <MuscleSetsChart sets={sets} target={WEEKLY_TARGET[prefs.goal]} />
        ) : (
          <p className="muted">Finish your first workout to see how your sets spread across muscles.</p>
        )}
      </section>

      {sheet && (
        <ExerciseSheet
          exerciseId={sheet}
          item={sheetItem}
          last={history[sheet]}
          units={units}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
