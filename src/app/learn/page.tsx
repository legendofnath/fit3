"use client";

import { useState } from "react";
import { ExerciseSheet, MUSCLE_NAME } from "@/components/ExerciseSheet";
import { EXERCISES, PATTERN_INFO } from "@/lib/exercises";
import { PRESCRIPTION } from "@/lib/generator";
import { WEEKLY_TARGET } from "@/lib/history";
import { GUIDES, ROLE_INFO, STYLE_INFO } from "@/lib/learn";
import { SPLITS } from "@/lib/splits";
import { useStore } from "@/lib/store";
import type { Muscle, Pattern } from "@/lib/types";

const STEPS = [
  "Your split decides the day: which muscles and movement patterns get trained.",
  "Each day is a list of slots, such as a main horizontal press or a side-delt accessory.",
  "For every slot, fit³ scores each exercise your gym can support. Standard, well-proven choices score highest; exercises you did recently lose points so sessions rotate; two very draining lifts in one session are avoided.",
  "Your goal sets the sets, reps and rest for each role, limited to what each exercise suits.",
  "If the session runs long, accessories go first, then sets are trimmed. Main lifts stay.",
  "After you log a workout, the next session picks targets from your results and the next day from what you have recovered from.",
];

const GOAL_LABEL = { bodybuilding: "Build muscle", strength: "Strength", power: "Power", weight_loss: "Lose weight" } as const;

export default function LearnPage() {
  const state = useStore();
  const [muscle, setMuscle] = useState<Muscle>("chest");
  const [sheet, setSheet] = useState<string | null>(null);
  const units = state.prefs?.units ?? "lb";
  const byMuscle = EXERCISES.filter((e) => e.muscle === muscle).sort((a, b) => b.staple - a.staple || a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h1 className="display">Learn</h1>
        <p className="lede">How your workouts are built, and what to know to get the most from them.</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="display">How fit³ builds a workout</h2>
        <ol className="flex max-w-3xl flex-col gap-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="num w-6 shrink-0 text-2xl" style={{ color: "var(--plate-yellow)" }}>
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="display">Sets, reps and rest</h2>
        <p className="lede">Each exercise in a session has a role. The role and your goal decide how it is trained.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {(["main", "secondary", "accessory"] as const).map((role) => (
            <div key={role} className="panel">
              <h3>{ROLE_INFO[role].name}</h3>
              <p className="muted small mt-1">{ROLE_INFO[role].about}</p>
            </div>
          ))}
        </div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[34rem] text-left">
            <thead>
              <tr className="small muted">
                <th className="p-3 font-medium">Style</th>
                <th className="p-3 font-medium">Main lift</th>
                <th className="p-3 font-medium">Secondary</th>
                <th className="p-3 font-medium">Accessory</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(PRESCRIPTION) as (keyof typeof PRESCRIPTION)[]).map((style) => (
                <tr key={style} className="border-t" style={{ borderColor: "var(--edge)" }}>
                  <th className="p-3 align-top font-semibold">{STYLE_INFO[style].name}</th>
                  {(["main", "secondary", "accessory"] as const).map((role) => {
                    const s = PRESCRIPTION[style][role];
                    return (
                      <td key={role} className="p-3 align-top">
                        <span className="num text-lg">
                          {s.sets} × {s.reps[0]}–{s.reps[1]}
                        </span>
                        <span className="muted small block">rest {s.rest >= 120 ? `${s.rest / 60} min` : `${s.rest}s`}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(STYLE_INFO) as (keyof typeof STYLE_INFO)[]).map((style) => (
            <div key={style} className="well">
              <h3>{STYLE_INFO[style].name}</h3>
              <p className="muted small mt-1">{STYLE_INFO[style].about}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="splits" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="display">Training splits</h2>
        <p className="lede">A split is how you divide your training across the week. Choose one on the workout screen.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {SPLITS.map((s) => (
            <article key={s.id} className="panel flex flex-col gap-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="display text-2xl">{s.name}</h3>
                <span className="muted small">
                  {s.daysPerWeek.join(" or ")} days · {s.level}
                </span>
              </div>
              <p className="small">{s.about}</p>
              <p className="muted small">Best for: {s.bestFor}</p>
              <ol className="mt-1 flex flex-wrap gap-2">
                {s.days.map((d, i) => (
                  <li key={i} className="tag">
                    {d.name}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="weekly-sets" className="flex scroll-mt-6 flex-col gap-4">
        <h2 className="display">Training guides</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {GUIDES.map((g) => (
            <article key={g.title} className="panel flex flex-col gap-2">
              <h3>{g.title}</h3>
              {g.body.map((p, i) => (
                <p key={i} className="small muted">
                  {p}
                </p>
              ))}
            </article>
          ))}
        </div>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[22rem] text-left">
            <caption className="muted small p-3 text-left">Common weekly hard-set range per muscle, by goal</caption>
            <tbody>
              {(Object.keys(WEEKLY_TARGET) as (keyof typeof WEEKLY_TARGET)[]).map((goal) => (
                <tr key={goal} className="border-t" style={{ borderColor: "var(--edge)" }}>
                  <th className="p-3 font-semibold">{GOAL_LABEL[goal]}</th>
                  <td className="num p-3 text-lg">
                    {WEEKLY_TARGET[goal][0]} to {WEEKLY_TARGET[goal][1]} sets
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="display">Movement patterns</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(PATTERN_INFO) as Pattern[]).map((p) => (
            <div key={p} className="well">
              <h3>{PATTERN_INFO[p].name}</h3>
              <p className="muted small mt-1">{PATTERN_INFO[p].about}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="display">Exercise library</h2>
        <p className="lede">{EXERCISES.length} exercises. Pick a muscle, then tap any exercise for how to do it.</p>
        <div className="choices rail lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" role="radiogroup" aria-label="Muscle">
          {(Object.keys(MUSCLE_NAME) as Muscle[]).map((m) => (
            <label key={m} className="choice">
              <input type="radio" name="muscle" checked={muscle === m} onChange={() => setMuscle(m)} />
              <span>{MUSCLE_NAME[m]}</span>
            </label>
          ))}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {byMuscle.map((e) => (
            <li key={e.id}>
              <button className="well w-full text-left" onClick={() => setSheet(e.id)}>
                <span className="block font-semibold">{e.name}</span>
                <span className="muted small">
                  {PATTERN_INFO[e.pattern].name} · {["", "Beginner", "Intermediate", "Advanced"][e.difficulty]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {sheet && <ExerciseSheet exerciseId={sheet} units={units} onClose={() => setSheet(null)} />}
    </div>
  );
}
